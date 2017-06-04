// Submit form with id function.
function submit_by_id() {
  var name = document.getElementById("name").value;
  var email = document.getElementById("email").value;
  if (validation()) // Calling validation function
    {
    document.getElementById("form_id").submit(); //form submission
    alert(" Name : " + name + " \n Email : " + email + " \n Form Id : " + document.getElementById("form_id").getAttribute("id") + "\n\n Form Submitted Successfully......");
    }
}

// validation Function.
function validation() {
  var name = document.getElementById("name").value;
  var email = document.getElementById("email").value;
  var due_date = document.getElementById("dueDate").value;
  var time_availability_to = document.getElementById("time_availability_to").value;
  var area_of_experties = document.getElementById("area_of_experties").value;
  var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  if (name === '' || email === '' || dueDate === '' || time_availability_to === '' || area_of_experties === '') {
    alert("Please fill all started fields!");
    return false;
  } else if (!(email).match(emailReg)) {
    alert("Invalid Email!");
    return false;
  } else {
    return true;
  }
}

exports.postClientReq= (req,res) => {
  res.redirect('/client/request/upload');
}

exports.getClientReq = (req, res) => {
  res.render('client_req', {
    title: 'Client Request'
  });
};
