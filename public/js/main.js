$(document).ready(function() {
  $("#browserid").click(function() {
    console.log('clicked on persona login');
    navigator.id.get(function(assertion) {
      if (assertion) {
        $('input[name="assertion"]').val(assertion);
        $('form[action="/auth/browserid"]').submit();
      } else {
        console.log('bad assertion');
        location.reload();
      }
    });
  });
  
  $("#logout").click(function() {
    console.log('logout');
    navigator.id.logout();
  })
});

