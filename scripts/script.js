$(document).ready(function () {
  // smooth scroll
  $("a").click(function (event) {
    if (this.hash !== "") {
      event.preventDefault();

      var hash = this.hash;

      $("html, body").animate(
        {
          scrollTop: $(hash).offset().top,
        },
        600,
        function () {
          window.location.hash = "";
        }
      );
    }
  });

  $("#nav-hamburger").click(function () {
    $("#mobile-nav").addClass("slide");
  });
  $("#close").click(function () {
    $("#mobile-nav").removeClass("slide");
  });
  $(".card-container").hover(
    function () {
      $(this).addClass("fadeIn");
    },
    function () {
      $(this).removeClass("fadeIn");
    }
  );

  $("#card1").click(function () {
    $(".card1-open").fadeIn(500).css("display", "flex");
    window.location.hash = "luxurity-card";
  });
  $("#card2").click(function () {
    $(".card2-open").fadeIn(500).css("display", "flex");
    window.location.hash = "homely-card";
  });
  $("#card3").click(function () {
    $(".card3-open").fadeIn(500).css("display", "flex");
    window.location.hash = "chatsy-card";
  });
  $("#card4").click(function () {
    $(".card4-open").fadeIn(500).css("display", "flex");
    window.location.hash = "ai-intelligence-card";
  });

  // carousel
  var carousels = document.querySelectorAll(".carousel");

  [].forEach.call(carousels, function (carousel) {
    carouselize(carousel);
  });

  function carouselize(carousel) {
    var imageBox = carousel.querySelector(".imageList"),
      imageWidth = $(imageBox).find("li:nth-child(1)").children("img").width(),
      imageQuantity = 3,
      currentImage = 1,
      carouselNext = carousel.querySelector(".next"),
      carouselPrev = carousel.querySelector(".prev");

    function transition(currentImageInput, imageWidthInput) {
      var pxValue = -(currentImageInput - 1) * imageWidthInput;
      $(imageBox).animate({
        left: pxValue,
      });
    }

    $(carouselNext).click(function () {
      if (currentImage === imageQuantity) {
        currentImage = 1;
        transition(currentImage, imageWidth);
      } else {
        currentImage++;
        transition(currentImage, imageWidth);
      }
    });
    $(carouselPrev).click(function () {
      if (currentImage === 1) {
        currentImage = imageQuantity;
        transition(currentImage, imageWidth);
      } else {
        currentImage--;
        transition(currentImage, imageWidth);
      }
    });

    $(".close").click(function () {
      window.history.back();
    });

    $(window).on("hashchange", function () {
      $(document).mouseup((e) => {
        // if click outside details card and its descendents, hide popup
        if (
          !$(".details-card").is(e.target) &&
          $(".details-card").has(e.target).length === 0
        ) {
          window.history.back();
        }
      });
      if (window.location.hash === "") {
        $(".canvas").fadeOut(500);
        if (currentImage !== 1) {
          currentImage = 1;
          transition(currentImage, imageWidth);
        }
      }
    });
  }
  // send contact form
  $("#contact-form").submit((e) => {
    e.preventDefault();

    $.ajax({
      url: "https://formspree.io/mnqdjjrk",
      method: "POST",
      data: { message: $("form").serialize() },
      dataType: "json",
    }).done((res) => {
      $("#success").addClass("reveal");
      $("#contact-form")
        .find("input[type=text], input[type=email], textarea")
        .val("");
    });
  });
});
