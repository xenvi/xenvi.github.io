$(function() {
  // smooth scroll
  $("a").click(function(event) {
    if (this.hash !== "") {
      event.preventDefault();

      var hash = this.hash;

      $("html, body").animate(
        {
          scrollTop: $(hash).offset().top
        },
        800,
        function() {
          window.location.hash = "";
        }
      );
    }
  });

  $("#nav-hamburger").click(function() {
    $("#mobile-nav").addClass("slide");
  });
  $("#close").click(function() {
    $("#mobile-nav").removeClass("slide");
  });
  $(".card").hover(
    function() {
      $(".card-container").addClass("fadeIn");
    },
    function() {
      $(".card-container").removeClass("fadeIn");
    }
  );

  // send contact form
  $("#contact-form").submit(e => {
    e.preventDefault();

    $.ajax({
      url: "https://formspree.io/mnqdjjrk",
      method: "POST",
      data: { message: $("form").serialize() },
      dataType: "json"
    }).done(res => {
      $("#success").addClass("reveal");
      $("#contact-form")
        .find("input[type=text], input[type=email], textarea")
        .val("");
    });
  });
});
