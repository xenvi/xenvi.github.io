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
    var scrollBottom = pos + $(window).height();

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
