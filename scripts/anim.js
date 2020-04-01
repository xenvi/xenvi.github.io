$(document).ready(function() {
  var isMobile;
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    isMobile = true;
  }

  $.fn.isInViewport = function() {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();

    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
  };

  $(window).on("scroll", function() {
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
    if (pos2 > $("#portfolio").offset().top) {
      highlightLink("portfolio");
    }
    if (pos2 > $("#contact").offset().top) {
      highlightLink("contact");
    }
    if ($("#about").isInViewport()) {
      gsap.from(".about-title", {
        opacity: 0,
        y: 10,
        duration: 2
      });
    }
  });

  // HOME PAGE //

  gsap.from(".intro1", {
    opacity: 0,
    x: 10,
    duration: 0.6,
    delay: 0
  });
  gsap.from(".intro2", {
    opacity: 0,
    x: 10,
    duration: 1,
    delay: 0.7
  });
  gsap.from(".intro3", {
    opacity: 0,
    x: 10,
    duration: 0.8,
    delay: 1.7
  });
  gsap.from(".fa-github", {
    rotation: 360,
    opacity: 0,
    y: 10,
    duration: 0.5,
    delay: 2.5
  });
  gsap.from(".fa-linkedin-in", {
    rotation: 360,
    opacity: 0,
    y: 10,
    duration: 0.5,
    delay: 3
  });
  gsap.from(".navbar", {
    opacity: 0,
    y: 10,
    duration: 0.5,
    delay: 3.5
  });
  gsap.from(".arrow-down", {
    opacity: 0,
    y: 20,
    ease: "bounce",
    duration: 1,
    delay: 4
  });
});
