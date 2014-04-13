
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
      },
      
      searlizeInputs: function(myNoun, myInputs) {
          
          this.setInputs();
          
          var outgoing = {};
          for(var i=0; i<this.inputs.length; i++) {
            
            var myVal = $(this.inputs[i]).val();
            var myName = $(this.inputs[i]).attr('name');
            var myParts = myName.split(/\[/);
            
            for(var ii=0; ii<myParts.length; ii++) {
              if(myParts[ii] != myNoun) {
                myParts[ii] = myParts[ii].replace(/]/, '');
              }
            }
            
            if(myParts.length == 1) {
              //outgoing[myPart] = myVal;
            } else if(myParts.length == 2) {
              outgoing[myParts[1]] = myVal;
            } else if(myParts.length == 3) {
              typeof outgoing[myParts[1]] === 'undefined' ? outgoing[myParts[1]]={}:'';
              outgoing[myParts[1]][myParts[2]] = myVal;
            } else {
              // deeper?
            }
            
          }
          
          return outgoing;
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
          
          if( !$('.new_user_form').length ) {
            new hs.views.AddUser({collection: hs.users });
          }
      }
  });
  
  //--------------------------------------------------------------------------
  // Add User View
  //--------------------------------------------------------------------------
  hs.views.AddUser = hs.views.userApp.extend({
      
      inputs: {},
      
      initialize: function(initData) {
          
          this.template = _.template( $('#addUserTemplate').html() );
          
          if(initData.init) {
              this.__initialize();
          } else {
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
          this.inputs = this.$el.find('input[name^=user]');//+this.model.noun+
      },
      
      addUserSocket: function(e) {
          var newUser = new hs.models.user(e);
          this.collection.add(newUser);
      },
      
      addUser: function(e) {
        e.preventDefault();
        
        var outgoing = this.searlizeInputs("user");
        
        this.collection.create(outgoing, { wait: true });
        
        this.cancel();
          
      },
      
      cancel: function() {
        var self=this;
        this.$el.find('.new_user_form').modal('hide').on('hidden.bs.modal', function() {
          this.remove();
        });
      },
      
      render: function() {
          
          var userViewHtml = this.template( {} );
          
          this.$el.html(userViewHtml).prependTo('body');
          
          return this;
      }
  });
  
  //--------------------------------------------------------------------------
  // Edit User View
  //--------------------------------------------------------------------------
  hs.views.EditUser = hs.views.userApp.extend({
      
      inputs: {},
      
      initialize: function(initData) {
          
          this.template = _.template( $('#editUserTemplate').html() );
          
          this.uiid = initData.uiid;
          this.setInputs();
          this.render();
      },
      
      events: {
          'submit': 'editUser',
          'click button.hs-cancel': 'cancel'
      },
      
      setInputs: function() {
          this.inputs = this.$el.find('input[name^='+this.model.noun+']'); //, select[name^=user], textarea[name^=user]
      },
      
      editUser: function(e) {
          
          e.preventDefault();
          
          var outgoing = this.searlizeInputs(this.model.noun);
          
          this.model.save(outgoing);
          
          this.cancel();
          
      },
      
      cancel: function() {
        var self=this;
        this.$el.find('.edit_user_form_'+this.uiid).modal('hide').on('hidden.bs.modal', function() {
          this.remove();
        });
      },
      
      render: function() {
          var myData = this.model.toJSON();
          
          myData.uiid = this.uiid;
          
          var html = this.template( myData );
          this.$el.html(html).prependTo('body');
          
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
      
      initialize: function() {
          
          this.template = _.template( $('#allUsersTemplate').html() );
          
          this.model.on('destroy', this.unrender, this);
          this.model.on('remove', this.unrender, this);
          this.model.on('change', this.render, this);
          
          var sig = this.signature(this.model);
          var sig2 = this.signature2(this.model);
          
          this.uiid = this.model.id;
          
          var editAction = 'update:'+this.model.noun;
          var editSig = this.event(editAction, sig);
          this.addSocketEvent(editSig, 'editUserSocket');
          
          var deleteAction = 'delete:'+this.model.noun;
          var deleteSig = this.event(deleteAction, sig);
          this.addSocketEvent(deleteSig, 'deleteUserSocket');
          
      },
      
      events: {
          'click a.hs-delete': 'deleteUser',
          'click a.hs-edit'  : 'editUser'
      },
      
      editUser: function(e) {
          
          var editForm = [];
          if(this.uiid) {
              var editForm = $('.edit_user_form_'+this.uiid);
          }
          
          if(!editForm.length) {
            new hs.views.EditUser({ model: this.model, uiid: this.uiid });
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
      
      render: function() {
          
          var myData = this.model.toJSON();
          
          myData.uiid = this.uiid;
          
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