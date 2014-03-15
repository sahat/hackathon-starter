jQuery(document).ready(function() {
(function($, Backbone) {
  
  if(!window.hs) { window.hs = {}; }
  
  hs = {
      baseUrl: 'http://127.0.0.1:3000/',
      socket: false,
      
      sessionkey: false,
      
      models: {},
      collections: {},
      
      views: {},
      router: {},
      
      events: {}
  };
  
  
  
  hs.init = function() {
      
      
    if($('#allUsers').length) {
      hs.users = new hs.collections.users();
      
      hs.users.fetch({
          noun:'user', 
          remove: false,
          'success':function(collection, response, options) {
              new hs.views.userApp({ collection: response });
          },'error': function(collection, response, options) {
              // TODO
          }
      });
    }
    
  };
  
  
  hs.keyGenerate = function(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    len = len || '24';
    var randomString = '';
    for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
  }
  
  
  
  
  // custom sync // Backbone 
  hs.sync = function(method, model, options) {
      socket = window.hs.socket;
      
      var syncSitename = options.sitename || (window.location.hostname + window.location.pathname);
      
      var signature = function(model) {
          var sig = {};  
          
          if(typeof model.url === 'function') {
              sig.endPoint = model.url();
          } else {
              sig.endPoint = model.url;
          }
          return sig;
      };
      
      //Create an event listener for server push
      var event = function(operation, sig) {
          var e = operation + ':';
          e += sig.endPoint;
          return e;
      };
      
      // Save a new model to the server.
      var create = function() { 
          var action = 'create:' + (model.noun || options.noun);
          var sign = signature(model);
          var e = event(action, sign);
          
          var myData = model.attributes;
          
          myData.site = syncSitename;
          
          socket.emit(action, {signature: sign, 'item': myData });//'noun':options.noun,
          socket.once(e, function(myData) {
              
              model.set('_id', myData.id);
              
              options.success(model.attributes);
          });
      };
      
      // Get a collection or model from the server.
      var read = function() {
          var action = 'read:' + (model.noun || options.noun);
          var sign = {endPoint:'default'};//signature(model);
          var e = event(action, sign);
          
          var outData = {};
          outData.signature = sign;
          outData.sitename = syncSitename;
          typeof options.getActive !== 'undefined' ? outData.getActive = options.getActive:'';
          
          socket.emit(action, outData);
          socket.once(e, function(myData) {
              options.success(myData);
          });
      };
      
      // Save an existing model to the server.
      var update = function() {
          var action = 'update:' + (model.noun || options.noun);
          var sign = signature(model);
          var e = event(action, sign);
          
          socket.emit(action, {signature: sign, 'item': model.attributes });
          socket.once(e, function(myData) {
              //TODO
          });
      }; 
   
      // Delete a model on the server.
      var destroy = function() {
          
          var action = 'delete:' + (model.noun || options.noun);
          var sign = signature(model);
          var e = event(action, sign);
          
          socket.emit(action, {signature: sign, 'item': model.attributes });
          socket.once(e, function(myData) {
              //TODO
          });                          
      };            
     
      // entry point for method
      switch (method) {
          case 'create':
              create();
              break;       
          case 'read': 
              read();
              break; 
          case 'update':
              update();
              break;
          case 'delete':
              destroy();
              break;
      }       
  };
  
  
  
  hs.socket = io.connect(hs.baseUrl, {'sync disconnect on unload' : true});
  
  
  // User Model
  hs.models.user = Backbone.Model.extend({
      /*initialize: function() {},
      validate: function(attrs) {},*/
      defaults : {
          _id: null
      },
      idAttribute : '_id',
      urlRoot: hs.baseUrl + 'users.js',
      noun: 'user',
      sync: hs.sync
  });
  hs.collections.users = Backbone.Collection.extend({
      /*initialize: function() {},*/
      model: hs.models.user,
      urlRoot: hs.baseUrl + 'users.js',
      unique: true,
      noun: 'user',
      sync: hs.sync
  });
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  // Backbone Views //////////////////////////////////////////////////////////////////
  
  hs.views.App = Backbone.View.extend({
      initialize: function() {},
      
      __initialize: function() {
          if (this.socket_events && _.size(this.socket_events) > 0) {
              this.delegateSocketEvents(this.socket_events);
          }
      },
      
      delegateSocketEvents: function(events) {
          for (var key in events) {
              this.addSocketEvent(key, events[key]);
          };
      },
      
      addSocketEvent: function(key, method) {
          if (!_.isFunction(method)) {
              method = this[method];
          }
          if (!method) {
              throw new Error('Method "' + method + '" does not exist');
          }
          method = _.bind(method, this);
          window.hs.socket.on(key, method);
      },
      
      //TODO ONE sig
      signature: function(model) {
          var sig = {};
          if(typeof model.url === 'function') {
              sig.endPoint = model.url();
          } else {
              sig.endPoint = model.url;
          }
          return sig;
      },
      signature2: function(model) {
          var sig = {};
          sig.endPoint = model.id;
          return sig;
      },
      event: function(operation, sig) {
          var e = operation + ':';
          e += sig.endPoint;
          if (sig.ctx) e += (':' + sig.ctx);
          return e;
      }
  
  });
  
  
  
  
  
  
  
  
  
  
  //--------------------------------------------------------------------------
  // Global User App View
  //--------------------------------------------------------------------------
  hs.views.userApp = hs.views.App.extend({
      
      initialize: function(initData) {
          new hs.views.AddUser({ init: true, collection: hs.users });
          
          var allUsersView = new hs.views.Users({ collection: hs.users });//hs.users
          $('#allUsers').append(allUsersView.render().el);
          
          $('.adduser').bind('click', this.addUser);
      },
      
      addUser: function(e) {
          e.preventDefault();
          
          if($('.new_user_form').length) {
            $('.new_user_form').modal('show');
          } else {
            var myTmpId = hs.keyGenerate();
            var myEl = $('<div/>', {id: 'hs_el_'+myTmpId}).prependTo('body');
            var addUserView = new hs.views.AddUser({el: myEl, collection: hs.users, new_key: myTmpId });
          }
          
      }
  });
  
  //--------------------------------------------------------------------------
  // Add User View
  //--------------------------------------------------------------------------
  hs.views.AddUser = hs.views.userApp.extend({
      template: _.template( $('#addUserTemplate').html() ),
      
      inputs: {},
      
      initialize: function(initData) {
        
          if(initData.init) {
              this.__initialize();
          } else {
              this.new_key = initData.new_key;
              this.form = $('#hs_el_'+ this.new_key);
              this.setInputs();
              this.render();
          } 
      },
      
      events: {
          'submit': 'addUser',
          'click button.hs-cancel': 'cancel'
      },
      
      socket_events: {
           'adduser': 'addUserSocket'
      },
      
      setInputs: function() {
          this.inputs.email = this.form.find('#user_email_'+this.new_key);
          this.inputs.profile_name = this.form.find('#user_profile_name_'+this.new_key);
      },
      
      addUserSocket: function(e) {
          var newUser = new hs.models.user(e);
          this.collection.add(newUser);
      },
      
      addUser: function(e) {
          e.preventDefault();
          
          this.setInputs();
          
          var outgoing = {profile:{}};
          for(var thisInput in this.inputs) {
              //some conditions for nexted profile data.
              if(thisInput == 'profile_name') {
                  outgoing['profile']['name'] = this.inputs[thisInput].val();
              } else {
                outgoing[thisInput] = this.inputs[thisInput].val();
              }
              
          }
          
          this.collection.create(outgoing, { wait: true });
          
          this.cancel();
          
      },
      
      cancel: function() {
        var self=this;
        this.$el.find('.new_user_form').modal('hide').on('hidden.bs.modal', function() {
          this.remove();
          self.form.remove();
        });
      },
      
      render: function() {
          
          var userViewHtml = this.template( {new_key: this.new_key} );
          
          this.$el.html(userViewHtml);
          
          return this;
      }
  });
  
  //--------------------------------------------------------------------------
  // Edit User View
  //--------------------------------------------------------------------------
  hs.views.EditUser = hs.views.userApp.extend({
      template: _.template( $('#editUserTemplate').html() ),
      inputs: {},
      
      initialize: function(initData) {
          
          this.render();
          
          this.new_key = initData.new_key;// || hs.keyGenerate();
          this.form = $('#hs_el_'+ this.new_key);
          
          this.setInputs();
          
      },
      
      events: {
          'submit': 'editUser',
          'click button.hs-cancel': 'cancel'
      },
      
      setInputs: function() {
          this.inputs.email = this.form.find('#edit_user_email_'+this.new_key);
          this.inputs.profile_name = this.form.find('#edit_user_profile_name_'+this.new_key);
      },
      
      editUser: function(e) {
          
          e.preventDefault();
          
          this.setInputs();//TODO remove
          
          var outgoing = {profile:{}};
          for(var thisInput in this.inputs) {
            
            //some conditions for nexted profile data.
            if(thisInput == 'profile_name') {
                outgoing['profile']['name'] = this.inputs[thisInput].val();
            } else {
              outgoing[thisInput] = this.inputs[thisInput].val();
            }
            
          }
          
          this.model.save(outgoing);
          
          this.cancel();
          
      },
      
      cancel: function() {
        
        var self=this;
        this.$el.find('.edit_user_form').modal('hide').on('hidden.bs.modal', function() {
          this.remove();
          self.form.remove();
        });
        
      },
      
      render: function() {
          var myData = this.model.toJSON();
          
          /*for(var thisInput in this.inputs) {
              myData[thisInput] = myData[thisInput] || '';
          }*/
          myData.email = myData.email || '';
          myData.profile_name = myData.profile.name || '';
          
          myData.new_key = this.new_key;
          
          var html = this.template( myData );
          this.$el.html(html);
          return this;
      }
  });

  //-------------------------------------------------------------------------
  // All Users View
  //--------------------------------------------------------------------------
  hs.views.Users = hs.views.userApp.extend({
      tagName: 'tbody',
      initialize: function() {
          
          this.collection.on('add', this.addOne, this);
      },
      
      render: function() {
          
          this.collection.each( this.addOne, this );
          
          return this;
      },
      
      addOne: function(myModel) {
          var userView = new hs.views.User({ model: myModel });
          var userViewHtml = userView.render().el;
          
          this.$el.append(userViewHtml);
          
          
      }
      
  });
  
  //-------------------------------------------------------------------------
  // Single User View
  //--------------------------------------------------------------------------
  hs.views.User = hs.views.userApp.extend({
      tagName: 'tr',
      template: _.template( $('#allUsersTemplate').html() ),
      initialize: function() {
          
          this.model.on('destroy', this.unrender, this);
          this.model.on('remove', this.unrender, this);
          this.model.on('change', this.render, this);
          
          var sig = this.signature(this.model);
          var sig2 = this.signature2(this.model);
          
          var editAction = 'update:'+this.model.noun;
          var editSig = this.event(editAction, sig);
          this.addSocketEvent(editSig, 'editUserSocket');
          
          var deleteAction = 'delete:'+this.model.noun;
          var deleteSig = this.event(deleteAction, sig);
          this.addSocketEvent(deleteSig, 'deleteUserSocket');
          
          //TODO update content with leave action +sig2? site too?
          var leaveAction = 'leave:'+this.model.noun;
          var leaveSig = this.event(leaveAction, sig2);
          this.addSocketEvent(leaveSig, 'leaveUserSocket');
      },
      events: {
          'click a.hs-delete': 'deleteUser',
          'click a.hs-edit'  : 'editUser'
      },
      
      currentEditId: false,
      editUser: function() {
          
          var editForm = false;
          if(this.currentEditId) {
              var editForm = $('#hs_el_'+this.currentEditId).find('.edit_user_form');
              editForm.length == 0 ? this.currentEditId = false : '';
          }
          
          if(this.currentEditId) {
            //var editForm = this.$el.find('#hs_el_'+this.currentEditId);
            $('#hs_el_'+this.currentEditId).find('.edit_user_form').modal('show');
            console.log($('#hs_el_'+this.currentEditId));
            console.log($('#hs_el_'+this.currentEditId).find('.edit_user_form'));
          } else {
              this.currentEditId = hs.keyGenerate();
              var myEl = $('<div/>', {id: 'hs_el_'+this.currentEditId}).prependTo('body');//.appendTo( this.$el );
              var editUserView = new hs.views.EditUser({ model: this.model, el: myEl, new_key: this.currentEditId });
          }
          
      },
      editUserSocket: function(myData) {
          
          if(myData.success == true ) {
              //TODO is there a better way to handel this emit event? 
                  // can it be a different event than the socket?
          } else {
              
              this.model.set(myData);
              
          }
          
      },
      deleteUserSocket: function(myData) {//myData?
          this.model.destroy();
      },
      deleteUser: function() {
          this.model.destroy();
      },
      leaveUserSocket: function(myData) {//myData?

          hs.users.remove( [{ id: this.model.id }] );
      },
      render: function() {
          
          var myData = this.model.toJSON();
          
          // TODO make sure required fields are set
          // TODO use the input keys to loop through the data keys.
          //for(var thisInput in this.inputs) {
          //    myData[thisInput] = myData[thisInput] || '';
          //}
          myData.profile_name = myData.profile.name || '';
          
          this.$el.html( this.template( myData ) );
          return this;
      },
      unrender: function() {
        
          this.remove();
      }
  });
  
  
  
  
  
  
  
  
  
  
  
  
  
  hs.init();
  
  
})(jQuery, Backbone);
});