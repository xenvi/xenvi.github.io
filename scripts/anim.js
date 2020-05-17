$(document).ready(function () {
  var isMobile;
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    isMobile = true;
  }

  $.fn.isInViewport = function () {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();

    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
  };

  $(window).on("scroll", function () {
    var pos = $(window).scrollTop();
    var pos2 = pos + 75;
    var pos3 = pos + $(window).height() / 9;
    var bottompos = pos + $(window).height();
    var bottompos2 = pos + $(window).height() / 3;

    function highlightLink(anchor) {
      $("nav .active").removeClass("active");
      $("nav")
        .find('[href="#' + anchor + '"]')
        .addClass("active");
    }

    // active link highlight
    if (pos2 > $("#home").offset().top) {
      highlightLink("home");
    }
    if (pos2 > $("#about").offset().top) {
      highlightLink("about");
    }
    if (pos2 > $("#projects").offset().top) {
      highlightLink("projects");
    }
    if (pos2 > $("#contact").offset().top) {
      highlightLink("contact");
    }

    // animate section elements
    if (bottompos2 > $("#about").offset().top) {
      // rotate svgs
      $(".svg").each((i, svg) => {
        $(svg).addClass("rotate-element");
        $(svg).removeClass("hidden");
      });
      // fade up text
      $(".aboutMainText").each((i, text) => {
        $(text).addClass("fade-up-element");
        $(text).removeClass("hidden");
      });
      $(".aboutSmallText").each((i, text) => {
        $(text).addClass("fade-up-far-element");
        $(text).removeClass("hidden");
      });
    }
    if (pos > $("#about").offset().top) {
      $(".svg").each((i, svg) => {
        $(svg).removeClass("rotate-element");
      });
    }

    if (bottompos2 > $("#projects").offset().top) {
      $(".card").each((i, card) => {
        $(card).addClass("fade-in-element");
        $(card).removeClass("hidden");
      });
      $(".projectsTitle").addClass("pulse-element");
    }
    if (pos > $("#projects").offset().top) {
      $(".projectsTitle").removeClass("pulse-element");
    }

    if (bottompos2 > $("#contact").offset().top) {
      $("#contact-form").addClass("fade-in-element");
      $("#contact-form").removeClass("hidden");
      $(".contactText").addClass("pulse-element");
    }
    if (pos > $("#contact").offset().top) {
      $(".contactText").removeClass("pulse-element");
    }
  });

  var tl = gsap.timeline();
  tl.from(".intro1", {
    opacity: 0,
    x: 10,
    duration: 0.6,
  });
  tl.from(".intro2", {
    opacity: 0,
    x: 10,
    duration: 1,
  });
  tl.from(".intro3", {
    opacity: 0,
    x: 10,
    duration: 0.8,
  });
  tl.from(".fa-github", {
    rotation: 360,
    opacity: 0,
    y: 10,
    duration: 0.5,
  });
  tl.from(".fa-linkedin-in", {
    rotation: 360,
    opacity: 0,
    y: 10,
    duration: 0.5,
  });
  tl.from(".navbar", {
    opacity: 0,
    y: 10,
    duration: 0.5,
  });
  tl.from(".arrow-down", {
    opacity: 0,
    y: 20,
    ease: "bounce",
    duration: 1,
  });
});
