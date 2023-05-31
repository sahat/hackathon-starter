/* eslint-env jquery, browser */
$(document).ready(() => {
  // function submitForm(event) {
  //   event.preventDefault(); // Empêche l'action par défaut de soumettre le formulaire
  
  //   var token = $("#floatingInput").val(); // Récupère la valeur de l'input du Github PAT
  //   var url = "https://api.github.com/repos/{owner}/{repo}"; // Remplacez {owner} et {repo} par les informations de votre répertoire cible
  
  //   // Envoie la requête AJAX
  //   $.ajax({
  //     url: url,
  //     type: "GET",
  //     beforeSend: function(xhr) {
  //       xhr.setRequestHeader("Authorization", "token " + token); // Ajoute l'en-tête Authorization avec le token
  //     },
  //     success: function(response) {
  //       // Succès de la requête
  //       console.log(response);
  //       // Ajoutez votre code pour gérer le succès ici, comme afficher un message de succès ou rediriger l'utilisateur vers la page suivante de l'onboarding
  //     },
  //     error: function(jqXHR, textStatus, errorThrown) {
  //       // Erreur de la requête
  //       console.log(textStatus + ": " + errorThrown);
  //       // Ajoutez votre code pour gérer l'erreur ici, comme afficher un message d'erreur ou demander à l'utilisateur de vérifier ses informations et de réessayer
  //     }
  //   });
  // }  
});
