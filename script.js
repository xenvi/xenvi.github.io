$(document).ready(function() {
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
  $(".card-container").hover(
    function() {
      $(this).addClass("fadeIn");
    },
    function() {
      $(this).removeClass("fadeIn");
    }
  );

  $("#card1").click(function() {
    $(".card1-open")
      .fadeIn(500)
      .css("display", "flex");
  });
  $("#card2").click(function() {
    $(".card2-open")
      .fadeIn(500)
      .css("display", "flex");
  });
  $(".close").click(function() {
    var currentImg = $(".current");
    $(".canvas").fadeOut(500);
    currentImg.removeClass("current");
    $(".slider-inner:first-child").addClass("current");
  });

  // carousel
  var imageBox = $(".carousel ul"),
    imageWidth = $(".carousel ul li")
      .first()
      .children("img")
      .width(),
    imageQuantity = $(".carousel ul").children("li").length,
    currentImage = 1;
  console.log(imageWidth);

  imageBox.css("width", imageWidth * imageQuantity);

  function transition(currentImageInput, imageWidthInput) {
    var pxValue = -(currentImageInput - 1) * imageWidthInput;
    imageBox.animate({
      left: pxValue
    });
  }

  $("#next").click(function() {
    if (currentImage === imageQuantity) {
      currentImage = 1;
      transition(currentImage, imageWidth);
    } else {
      currentImage++;
      transition(currentImage, imageWidth);
    }
  });
  $("#prev").click(function() {
    if (currentImage === 1) {
      currentImage = imageQuantity;
      transition(currentImage, imageWidth);
    } else {
      currentImage--;
      transition(currentImage, imageWidth);
    }
  });

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
