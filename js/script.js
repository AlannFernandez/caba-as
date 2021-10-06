"use strict";
(function() {
    var userAgent = navigator.userAgent.toLowerCase()
      , initialDate = new Date()
      , $document = $(document)
      , $window = $(window)
      , $html = $("html")
      , $body = $("body")
      , isDesktop = $html.hasClass("desktop")
      , isIE = userAgent.indexOf("msie") !== -1 ? parseInt(userAgent.split("msie")[1], 10) : userAgent.indexOf("trident") !== -1 ? 11 : userAgent.indexOf("edge") !== -1 ? 12 : false
      , isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      , windowReady = false
      , isNoviBuilder = false
      , livedemo = true
      , plugins = {
        copyrightYear: $('.copyright-year'),
        wow: $('.wow'),
        maps: $('.google-map-container'),
        customWaypoints: $('[data-waypoint-to]'),
        owl: $('.owl-carousel'),
        preloader: $('.preloader'),
        popover: $('[data-toggle="popover"]'),
        rdMailForm: $('.rd-mailform'),
        rdInputLabel: $('.form-label'),
        regula: $('[data-constraints]'),
        selectFilter: $(".select"),
        swiper: $('.swiper-container'),
        campaignMonitor: $('.campaign-mailform'),
        bootstrapDateTimePicker: $("[data-time-picker]"),
        bootstrapTabs: $('.tabs-custom'),
    };
    function isScrolledIntoView(elem) {
        if (isNoviBuilder)
            return true;
        return elem.offset().top + elem.outerHeight() >= $window.scrollTop() && elem.offset().top <= $window.scrollTop() + $window.height();
    }
    function lazyInit(element, func) {
        var scrollHandler = function() {
            if ((!element.hasClass('lazy-loaded') && (isScrolledIntoView(element)))) {
                func.call(element);
                element.addClass('lazy-loaded');
            }
        };
        scrollHandler();
        $window.on('scroll', scrollHandler);
    }
    $window.on('load', function() {
        if (plugins.preloader.length && !isNoviBuilder) {
            pageTransition({
                target: document.querySelector('.page'),
                delay: 0,
                duration: 500,
                classIn: 'fadeIn',
                classOut: 'fadeOut',
                classActive: 'animated',
                conditions: function(event, link) {
                    return link && !/(\#|javascript:void\(0\)|callto:|tel:|mailto:|:\/\/)/.test(link) && !event.currentTarget.hasAttribute('data-lightgallery');
                },
                onTransitionStart: function(options) {
                    setTimeout(function() {
                        plugins.preloader.removeClass('loaded');
                    }, options.duration * .75);
                },
                onReady: function() {
                    plugins.preloader.addClass('loaded');
                    windowReady = true;
                }
            });
        }
    });
    $(function() {
        isNoviBuilder = window.xMode;
        function toggleSwiperInnerVideos(swiper) {
            var prevSlide = $(swiper.slides[swiper.previousIndex]), nextSlide = $(swiper.slides[swiper.activeIndex]), videos, videoItems = prevSlide.find("video");
            for (var i = 0; i < videoItems.length; i++) {
                videoItems[i].pause();
            }
            videos = nextSlide.find("video");
            if (videos.length) {
                videos.get(0).play();
            }
        }
        function toggleSwiperCaptionAnimation(swiper) {
            var prevSlide = $(swiper.container).find("[data-caption-animate]"), nextSlide = $(swiper.slides[swiper.activeIndex]).find("[data-caption-animate]"), delay, duration, nextSlideItem, prevSlideItem;
            for (var i = 0; i < prevSlide.length; i++) {
                prevSlideItem = $(prevSlide[i]);
                prevSlideItem.removeClass("animated").removeClass(prevSlideItem.attr("data-caption-animate")).addClass("not-animated");
            }
            var tempFunction = function(nextSlideItem, duration) {
                return function() {
                    nextSlideItem.removeClass("not-animated").addClass(nextSlideItem.attr("data-caption-animate")).addClass("animated");
                    if (duration) {
                        nextSlideItem.css('animation-duration', duration + 'ms');
                    }
                }
                ;
            };
            for (var i = 0; i < nextSlide.length; i++) {
                nextSlideItem = $(nextSlide[i]);
                delay = nextSlideItem.attr("data-caption-delay");
                duration = nextSlideItem.attr('data-caption-duration');
                if (!isNoviBuilder) {
                    if (delay) {
                        setTimeout(tempFunction(nextSlideItem, duration), parseInt(delay, 10));
                    } else {
                        tempFunction(nextSlideItem, duration);
                    }
                } else {
                    nextSlideItem.removeClass("not-animated")
                }
            }
        }
        function getLatLngObject(str, marker, map, callback) {
            var coordinates = {};
            try {
                coordinates = JSON.parse(str);
                callback(new google.maps.LatLng(coordinates.lat,coordinates.lng), marker, map)
            } catch (e) {
                map.geocoder.geocode({
                    'address': str
                }, function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        var latitude = results[0].geometry.location.lat();
                        var longitude = results[0].geometry.location.lng();
                        callback(new google.maps.LatLng(parseFloat(latitude),parseFloat(longitude)), marker, map)
                    }
                })
            }
        }
        function initMaps() {
            var key;
            for (var i = 0; i < plugins.maps.length; i++) {
                if (plugins.maps[i].hasAttribute("data-key")) {
                    key = plugins.maps[i].getAttribute("data-key");
                    break;
                }
            }
            $.getScript('//maps.google.com/maps/api/js?' + (key ? 'key=' + key + '&' : '') + 'libraries=geometry,places&v=quarterly', function() {
                var head = document.getElementsByTagName('head')[0]
                  , insertBefore = head.insertBefore;
                head.insertBefore = function(newElement, referenceElement) {
                    if (newElement.href && newElement.href.indexOf('//fonts.googleapis.com/css?family=Roboto') !== -1 || newElement.innerHTML.indexOf('gm-style') !== -1) {
                        return;
                    }
                    insertBefore.call(head, newElement, referenceElement);
                }
                ;
                var geocoder = new google.maps.Geocoder;
                for (var i = 0; i < plugins.maps.length; i++) {
                    var zoom = parseInt(plugins.maps[i].getAttribute("data-zoom"), 10) || 11;
                    var styles = plugins.maps[i].hasAttribute('data-styles') ? JSON.parse(plugins.maps[i].getAttribute("data-styles")) : [];
                    var center = plugins.maps[i].getAttribute("data-center") || "New York";
                    var map = new google.maps.Map(plugins.maps[i].querySelectorAll(".google-map")[0],{
                        zoom: zoom,
                        styles: styles,
                        scrollwheel: false,
                        center: {
                            lat: 0,
                            lng: 0
                        }
                    });
                    plugins.maps[i].map = map;
                    plugins.maps[i].geocoder = geocoder;
                    plugins.maps[i].keySupported = true;
                    plugins.maps[i].google = google;
                    getLatLngObject(center, null, plugins.maps[i], function(location, markerElement, mapElement) {
                        mapElement.map.setCenter(location);
                    });
                    var markerItems = plugins.maps[i].querySelectorAll(".google-map-markers li");
                    if (markerItems.length) {
                        var markers = [];
                        for (var j = 0; j < markerItems.length; j++) {
                            var markerElement = markerItems[j];
                            getLatLngObject(markerElement.getAttribute("data-location"), markerElement, plugins.maps[i], function(location, markerElement, mapElement) {
                                var icon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon");
                                var activeIcon = markerElement.getAttribute("data-icon-active") || mapElement.getAttribute("data-icon-active");
                                var info = markerElement.getAttribute("data-description") || "";
                                var infoWindow = new google.maps.InfoWindow({
                                    content: info
                                });
                                markerElement.infoWindow = infoWindow;
                                var markerData = {
                                    position: location,
                                    map: mapElement.map
                                }
                                if (icon) {
                                    markerData.icon = icon;
                                }
                                var marker = new google.maps.Marker(markerData);
                                markerElement.gmarker = marker;
                                markers.push({
                                    markerElement: markerElement,
                                    infoWindow: infoWindow
                                });
                                marker.isActive = false;
                                google.maps.event.addListener(infoWindow, 'closeclick', (function(markerElement, mapElement) {
                                    var markerIcon = null;
                                    markerElement.gmarker.isActive = false;
                                    markerIcon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon");
                                    markerElement.gmarker.setIcon(markerIcon);
                                }
                                ).bind(this, markerElement, mapElement));
                                google.maps.event.addListener(marker, 'click', (function(markerElement, mapElement) {
                                    if (markerElement.infoWindow.getContent().length === 0)
                                        return;
                                    var gMarker, currentMarker = markerElement.gmarker, currentInfoWindow;
                                    for (var k = 0; k < markers.length; k++) {
                                        var markerIcon;
                                        if (markers[k].markerElement === markerElement) {
                                            currentInfoWindow = markers[k].infoWindow;
                                        }
                                        gMarker = markers[k].markerElement.gmarker;
                                        if (gMarker.isActive && markers[k].markerElement !== markerElement) {
                                            gMarker.isActive = false;
                                            markerIcon = markers[k].markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon")
                                            gMarker.setIcon(markerIcon);
                                            markers[k].infoWindow.close();
                                        }
                                    }
                                    currentMarker.isActive = !currentMarker.isActive;
                                    if (currentMarker.isActive) {
                                        if (markerIcon = markerElement.getAttribute("data-icon-active") || mapElement.getAttribute("data-icon-active")) {
                                            currentMarker.setIcon(markerIcon);
                                        }
                                        currentInfoWindow.open(map, marker);
                                    } else {
                                        if (markerIcon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon")) {
                                            currentMarker.setIcon(markerIcon);
                                        }
                                        currentInfoWindow.close();
                                    }
                                }
                                ).bind(this, markerElement, mapElement))
                            })
                        }
                    }
                }
            });
        }
        function initOwlCarousel(carousel) {
            var aliaces = ['-', '-sm-', '-md-', '-lg-', '-xl-', '-xxl-']
              , values = [0, 576, 768, 992, 1200, 1600]
              , responsive = {};
            for (var j = 0; j < values.length; j++) {
                responsive[values[j]] = {};
                for (var k = j; k >= -1; k--) {
                    if (!responsive[values[j]]['items'] && carousel.attr('data' + aliaces[k] + 'items')) {
                        responsive[values[j]]['items'] = k < 0 ? 1 : parseInt(carousel.attr('data' + aliaces[k] + 'items'), 10);
                    }
                    if (!responsive[values[j]]['stagePadding'] && responsive[values[j]]['stagePadding'] !== 0 && carousel.attr('data' + aliaces[k] + 'stage-padding')) {
                        responsive[values[j]]['stagePadding'] = k < 0 ? 0 : parseInt(carousel.attr('data' + aliaces[k] + 'stage-padding'), 10);
                    }
                    if (!responsive[values[j]]['margin'] && responsive[values[j]]['margin'] !== 0 && carousel.attr('data' + aliaces[k] + 'margin')) {
                        responsive[values[j]]['margin'] = k < 0 ? 30 : parseInt(carousel.attr('data' + aliaces[k] + 'margin'), 10);
                    }
                }
            }
            if (carousel.attr('data-dots-custom')) {
                carousel.on('initialized.owl.carousel', function(event) {
                    var carousel = $(event.currentTarget)
                      , customPag = $(carousel.attr('data-dots-custom'))
                      , active = 0;
                    if (carousel.attr('data-active')) {
                        active = parseInt(carousel.attr('data-active'), 10);
                    }
                    carousel.trigger('to.owl.carousel', [active, 300, true]);
                    customPag.find('[data-owl-item="' + active + '"]').addClass('active');
                    customPag.find('[data-owl-item]').on('click', function(event) {
                        event.preventDefault();
                        carousel.trigger('to.owl.carousel', [parseInt(this.getAttribute('data-owl-item'), 10), 300, true]);
                    });
                    carousel.on('translate.owl.carousel', function(event) {
                        customPag.find('.active').removeClass('active');
                        customPag.find('[data-owl-item="' + event.item.index + '"]').addClass('active')
                    });
                });
            }
            carousel.owlCarousel({
                autoplay: isNoviBuilder ? false : carousel.attr('data-autoplay') !== 'false',
                autoplayTimeout: carousel.attr("data-autoplay") ? Number(carousel.attr("data-autoplay")) : 3000,
                autoplayHoverPause: true,
                loop: isNoviBuilder ? false : carousel.attr('data-loop') !== 'false',
                items: 1,
                center: carousel.attr('data-center') === 'true',
                dotsContainer: carousel.attr('data-pagination-class') || false,
                navContainer: carousel.attr('data-navigation-class') || false,
                mouseDrag: isNoviBuilder ? false : carousel.attr('data-mouse-drag') !== 'false',
                nav: carousel.attr('data-nav') === 'true',
                dots: carousel.attr('data-dots') === 'true',
                dotsEach: carousel.attr('data-dots-each') ? parseInt(carousel.attr('data-dots-each'), 10) : false,
                animateIn: carousel.attr('data-animation-in') ? carousel.attr('data-animation-in') : false,
                animateOut: carousel.attr('data-animation-out') ? carousel.attr('data-animation-out') : false,
                responsive: responsive,
                navText: ["<div class='nav__img'></div><span class='icon icon-primary icon-lg material-icons-trending_flat'></span>", "<div class='nav__img'></div><span class='icon icon-primary icon-lg material-icons-trending_flat'></span>"],
                navClass: carousel.attr('data-nav-class') ? $.parseJSON(carousel.attr('data-nav-class')) : ['owl-prev', 'owl-next'],
                onTranslated: function() {
                    var active = $('.owl-carousel .active');
                    var select = $('.owl-carousel .owl-stage > .owl-item');
                    var size = (active.length);
                    var current = this._current;
                    var navNext, navPrev;
                    if ((size + current) >= select.length) {
                        navNext = select.eq((size * 2)).find('img').attr('src');
                        navPrev = select.eq((size * 2) - size - 1).find('img').attr('src');
                    } else {
                        navNext = select.eq(current + size).find('img').attr('src');
                        navPrev = select.eq(current - 1).find('img').attr('src');
                    }
                    $('.owl-carousel').find('.owl-prev .nav__img').css("background-image", "url(" + navPrev + ")");
                    $('.owl-carousel').find('.owl-next .nav__img').css("background-image", "url(" + navNext + ")");
                }
            });
        }
        function attachFormValidator(elements) {
            regula.custom({
                name: 'PhoneNumber',
                defaultMessage: 'Formato de número inválido',
                validator: function() {
                    if (this.value === '')
                        return true;
                    else
                        return /^(\+\d)?[0-9\-\(\) ]{5,}$/i.test(this.value);
                }
            });
            for (var i = 0; i < elements.length; i++) {
                var o = $(elements[i]), v;
                o.addClass("form-control-has-validation").after("<span class='form-validation'></span>");
                v = o.parent().find(".form-validation");
                if (v.is(":last-child"))
                    o.addClass("form-control-last-child");
            }
            elements.on('input change propertychange blur', function(e) {
                var $this = $(this), results;
                if (e.type !== "blur")
                    if (!$this.parent().hasClass("has-error"))
                        return;
                if ($this.parents('.rd-mailform').hasClass('success'))
                    return;
                if ((results = $this.regula('validate')).length) {
                    for (i = 0; i < results.length; i++) {
                        $this.siblings(".form-validation").text(results[i].message).parent().addClass("has-error");
                    }
                } else {
                    $this.siblings(".form-validation").text("").parent().removeClass("has-error")
                }
            }).regula('bind');
            var regularConstraintsMessages = [{
                type: regula.Constraint.Required,
                newMessage: "Complete este campo."
            }, {
                type: regula.Constraint.Email,
                newMessage: "Escriba un email válido."
            }, {
                type: regula.Constraint.Numeric,
                newMessage: "Solo escriba números"
            }, {
                type: regula.Constraint.Selected,
                newMessage: "Por favor elija una opción."
            }];
            for (var i = 0; i < regularConstraintsMessages.length; i++) {
                var regularConstraint = regularConstraintsMessages[i];
                regula.override({
                    constraintType: regularConstraint.type,
                    defaultMessage: regularConstraint.newMessage
                });
            }
        }
        function isValidated(elements, captcha) {
            var results, errors = 0;
            if (elements.length) {
                for (var j = 0; j < elements.length; j++) {
                    var $input = $(elements[j]);
                    if ((results = $input.regula('validate')).length) {
                        for (k = 0; k < results.length; k++) {
                            errors++;
                            $input.siblings(".form-validation").text(results[k].message).parent().addClass("has-error");
                        }
                    } else {
                        $input.siblings(".form-validation").text("").parent().removeClass("has-error")
                    }
                }
                if (captcha) {
                    if (captcha.length) {
                        return validateReCaptcha(captcha) && errors === 0
                    }
                }
                return errors === 0;
            }
            return true;
        }
        function validateReCaptcha(captcha) {
            var captchaToken = captcha.find('.g-recaptcha-response').val();
            if (captchaToken.length === 0) {
                captcha.siblings('.form-validation').html('Por favor, compruebe que no es un robot.').addClass('active');
                captcha.closest('.form-wrap').addClass('has-error');
                captcha.on('propertychange', function() {
                    var $this = $(this)
                      , captchaToken = $this.find('.g-recaptcha-response').val();
                    if (captchaToken.length > 0) {
                        $this.closest('.form-wrap').removeClass('has-error');
                        $this.siblings('.form-validation').removeClass('active').html('');
                        $this.off('propertychange');
                    }
                });
                return false;
            }
            return true;
        }
        window.onloadCaptchaCallback = function() {
            for (var i = 0; i < plugins.captcha.length; i++) {
                var $captcha = $(plugins.captcha[i])
                  , resizeHandler = (function() {
                    var frame = this.querySelector('iframe')
                      , inner = this.firstElementChild
                      , inner2 = inner.firstElementChild
                      , containerRect = null
                      , frameRect = null
                      , scale = null;
                    inner2.style.transform = '';
                    inner.style.height = 'auto';
                    inner.style.width = 'auto';
                    containerRect = this.getBoundingClientRect();
                    frameRect = frame.getBoundingClientRect();
                    scale = containerRect.width / frameRect.width;
                    if (scale < 1) {
                        inner2.style.transform = 'scale(' + scale + ')';
                        inner.style.height = (frameRect.height * scale) + 'px';
                        inner.style.width = (frameRect.width * scale) + 'px';
                    }
                }
                ).bind(plugins.captcha[i]);
                grecaptcha.render($captcha.attr('id'), {
                    sitekey: $captcha.attr('data-sitekey'),
                    size: $captcha.attr('data-size') ? $captcha.attr('data-size') : 'normal',
                    theme: $captcha.attr('data-theme') ? $captcha.attr('data-theme') : 'light',
                    callback: function() {
                        $('.recaptcha').trigger('propertychange');
                    }
                });
                $captcha.after("<span class='form-validation'></span>");
                if (plugins.captcha[i].hasAttribute('data-auto-size')) {
                    resizeHandler();
                    window.addEventListener('resize', resizeHandler);
                }
            }
        }
        ;
        if (plugins.swiper.length) {
            for (var i = 0; i < plugins.swiper.length; i++) {
                var s = $(plugins.swiper[i]);
                var pag = s.find(".swiper-pagination")
                  , next = s.find(".swiper-button-next")
                  , prev = s.find(".swiper-button-prev")
                  , bar = s.find(".swiper-scrollbar")
                  , swiperSlide = s.find(".swiper-slide")
                  , autoplay = false;
                for (var j = 0; j < swiperSlide.length; j++) {
                    var $this = $(swiperSlide[j]), url;
                    if (url = $this.attr("data-slide-bg")) {
                        $this.css({
                            "background-image": "url(" + url + ")",
                            "background-size": "cover"
                        })
                    }
                }
                swiperSlide.end().find("[data-caption-animate]").addClass("not-animated").end();
                s.swiper({
                    autoplay: !isNoviBuilder && $.isNumeric(s.attr('data-autoplay')) ? s.attr('data-autoplay') : false,
                    direction: s.attr('data-direction') ? s.attr('data-direction') : "horizontal",
                    effect: s.attr('data-slide-effect') ? s.attr('data-slide-effect') : "slide",
                    speed: s.attr('data-slide-speed') ? s.attr('data-slide-speed') : 600,
                    keyboardControl: s.attr('data-keyboard') === "true",
                    mousewheelControl: s.attr('data-mousewheel') === "true",
                    mousewheelReleaseOnEdges: s.attr('data-mousewheel-release') === "true",
                    nextButton: next.length ? next.get(0) : null,
                    prevButton: prev.length ? prev.get(0) : null,
                    pagination: pag.length ? pag.get(0) : null,
                    paginationClickable: pag.length ? pag.attr("data-clickable") !== "false" : false,
                    paginationBulletRender: pag.length ? pag.attr("data-index-bullet") === "true" ? function(swiper, index, className) {
                        return '<span class="' + className + '">' + (index + 1) + '</span>';
                    }
                    : null : null,
                    scrollbar: bar.length ? bar.get(0) : null,
                    scrollbarDraggable: bar.length ? bar.attr("data-draggable") !== "false" : true,
                    scrollbarHide: bar.length ? bar.attr("data-draggable") === "false" : false,
                    loop: isNoviBuilder ? false : s.attr('data-loop') !== "false",
                    simulateTouch: s.attr('data-simulate-touch') && !isNoviBuilder ? s.attr('data-simulate-touch') === "true" : false,
                    onTransitionStart: function(swiper) {
                        toggleSwiperInnerVideos(swiper);
                    },
                    onTransitionEnd: function(swiper) {
                        toggleSwiperCaptionAnimation(swiper);
                    },
                    onInit: function(swiper) {
                        toggleSwiperInnerVideos(swiper);
                        toggleSwiperCaptionAnimation(swiper);
                    },
                    onSlideChangeStart: function(swiper) {
                        var activeSlideIndex, slidesCount;
                        activeSlideIndex = swiper.activeIndex;
                        slidesCount = swiper.slides.not(".swiper-slide-duplicate").length;
                        if (activeSlideIndex === slidesCount + 1) {
                            activeSlideIndex = 1;
                        } else if (activeSlideIndex === 0) {
                            activeSlideIndex = slidesCount;
                        }
                        $(swiper.container).find('.swiper-button-prev .nav__img').css("background-image", "url(" + swiper.slides[activeSlideIndex - 1].getAttribute("data-slide-bg") + ")");
                        $(swiper.container).find('.swiper-button-next .nav__img').css("background-image", "url(" + swiper.slides[activeSlideIndex + 1].getAttribute("data-slide-bg") + ")");
                    }
                });
            }
        }
        if (isIE) {
            if (isIE === 12)
                $html.addClass("ie-edge");
            if (isIE === 11)
                $html.addClass("ie-11");
            if (isIE < 10)
                $html.addClass("lt-ie-10");
            if (isIE < 11)
                $html.addClass("ie-10");
        }
        if (plugins.popover.length) {
            if (window.innerWidth < 767) {
                plugins.popover.attr('data-placement', 'bottom');
                plugins.popover.popover();
            } else {
                plugins.popover.popover();
            }
        }
        if (isDesktop && !isNoviBuilder) {
            $().UItoTop({
                easingType: 'easeOutQuad',
                containerClass: 'ui-to-top fa fa-angle-up'
            });
        }
        if ($html.hasClass("wow-animation") && plugins.wow.length && !isNoviBuilder && isDesktop) {
            new WOW().init();
        }
        if (plugins.rdInputLabel.length) {
            plugins.rdInputLabel.RDInputLabel();
        }
        if (plugins.regula.length) {
            attachFormValidator(plugins.regula);
        }
        if (plugins.campaignMonitor.length) {
            for (i = 0; i < plugins.campaignMonitor.length; i++) {
                var $campaignItem = $(plugins.campaignMonitor[i]);
                $campaignItem.on('submit', $.proxy(function(e) {
                    var data = {}
                      , url = this.attr('action')
                      , dataArray = this.serializeArray()
                      , $output = $("#" + plugins.campaignMonitor.attr("data-form-output"))
                      , $this = $(this);
                    for (i = 0; i < dataArray.length; i++) {
                        data[dataArray[i].name] = dataArray[i].value;
                    }
                    $.ajax({
                        data: data,
                        url: url,
                        dataType: 'jsonp',
                        error: function(resp, text) {
                            $output.html('Server error: ' + text);
                            setTimeout(function() {
                                $output.removeClass("active");
                            }, 4000);
                        },
                        success: function(resp) {
                            $output.html(resp.Message).addClass('active');
                            setTimeout(function() {
                                $output.removeClass("active");
                            }, 6000);
                        },
                        beforeSend: function(data) {
                            if (isNoviBuilder || !isValidated($this.find('[data-constraints]')))
                                return false;
                            $output.html('Enviando...').addClass('active');
                        }
                    });
                    var inputs = $this[0].getElementsByTagName('input');
                    for (var i = 0; i < inputs.length; i++) {
                        inputs[i].value = '';
                        var label = document.querySelector('[for="' + inputs[i].getAttribute('id') + '"]');
                        if (label)
                            label.classList.remove('focus', 'not-empty');
                    }
                    return false;
                }, $campaignItem));
            }
        }
        if (plugins.rdMailForm.length) {
            var i, j, k, msg = {
                'MF000': 'Emviado correctamente!',
                'MF001': 'Recipients are not set!',
                'MF002': 'El formulario no trabaja localmente!',
                'MF003': 'Por favor escriba su email',
                'MF004': 'Por favor seleccione la habitación',
                'MF254': 'Ha ocurrido un error con PHPMailer!',
                'MF255': 'Uos! ha ocurrido un error.'
            };
            for (i = 0; i < plugins.rdMailForm.length; i++) {
                var $form = $(plugins.rdMailForm[i])
                  , formHasCaptcha = false;
                $form.attr('novalidate', 'novalidate').ajaxForm({
                    data: {
                        "form-type": $form.attr("data-form-type") || "contact",
                        "counter": i
                    },
                    beforeSubmit: function(arr, $form, options) {
                        if (isNoviBuilder)
                            return;
                        var form = $(plugins.rdMailForm[this.extraData.counter])
                          , inputs = form.find("[data-constraints]")
                          , output = $("#" + form.attr("data-form-output"))
                          , captcha = form.find('.recaptcha')
                          , captchaFlag = true;
                        output.removeClass("active error success");
                        if (isValidated(inputs, captcha)) {
                            if (captcha.length) {
                                var captchaToken = captcha.find('.g-recaptcha-response').val()
                                  , captchaMsg = {
                                    'CPT001': 'Please, setup you "site key" and "secret key" of reCaptcha',
                                    'CPT002': 'Something wrong with google reCaptcha'
                                };
                                formHasCaptcha = true;
                                $.ajax({
                                    method: "POST",
                                    url: "bat/reCaptcha.php",
                                    data: {
                                        'g-recaptcha-response': captchaToken
                                    },
                                    async: false
                                }).done(function(responceCode) {
                                    if (responceCode !== 'CPT000') {
                                        if (output.hasClass("snackbars")) {
                                            output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + captchaMsg[responceCode] + '</span></p>')
                                            setTimeout(function() {
                                                output.removeClass("active");
                                            }, 3500);
                                            captchaFlag = false;
                                        } else {
                                            output.html(captchaMsg[responceCode]);
                                        }
                                        output.addClass("active");
                                    }
                                });
                            }
                            if (!captchaFlag) {
                                return false;
                            }
                            form.addClass('form-in-process');
                            if (output.hasClass("snackbars")) {
                                output.html('<p><span class="icon text-middle fa fa-circle-o-notch fa-spin icon-xxs"></span><span>Enviando</span></p>');
                                output.addClass("active");
                            }
                        } else {
                            return false;
                        }
                    },
                    error: function(result) {
                        if (isNoviBuilder)
                            return;
                        var output = $("#" + $(plugins.rdMailForm[this.extraData.counter]).attr("data-form-output"))
                          , form = $(plugins.rdMailForm[this.extraData.counter]);
                        output.text(msg[result]);
                        form.removeClass('form-in-process');
                        if (formHasCaptcha) {
                            grecaptcha.reset();
                        }
                    },
                    success: function(result) {
                        if (isNoviBuilder)
                            return;
                        var form = $(plugins.rdMailForm[this.extraData.counter])
                          , output = $("#" + form.attr("data-form-output"))
                          , select = form.find('select');
                        form.addClass('success').removeClass('form-in-process');
                        if (formHasCaptcha) {
                            grecaptcha.reset();
                        }
                        result = result.length === 5 ? result : 'MF255';
                        output.text(msg[result]);
                        if (result === "MF000") {
                            if (output.hasClass("snackbars")) {
                                output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + msg[result] + '</span></p>');
                            } else {
                                output.addClass("active success");
                            }
                        } else {
                            if (output.hasClass("snackbars")) {
                                output.html(' <p class="snackbars-left"><span class="icon icon-xxs mdi mdi-alert-outline text-middle"></span><span>' + msg[result] + '</span></p>');
                            } else {
                                output.addClass("active error");
                            }
                        }
                        form.clearForm();
                        if (select.length) {
                            select.select2("val", "");
                        }
                        form.find('input, textarea').trigger('blur');
                        setTimeout(function() {
                            output.removeClass("active error success");
                            form.removeClass('success');
                        }, 3500);
                    }
                });
            }
        }
        if (plugins.maps.length) {
            lazyInit(plugins.maps, initMaps);
        }
        if (plugins.owl.length) {
            for (var i = 0; i < plugins.owl.length; i++) {
                var carousel = $(plugins.owl[i]);
                plugins.owl[i].owl = carousel;
                initOwlCarousel(carousel);
            }
        }
        if (plugins.customWaypoints.length && !isNoviBuilder) {
            var i;
            for (i = 0; i < plugins.customWaypoints.length; i++) {
                var $this = $(plugins.customWaypoints[i]);
                $this.on('click', function(e) {
                    e.preventDefault();
                    $("body, html").stop().animate({
                        scrollTop: $($(this).attr('data-waypoint-to')).offset().top
                    }, 1000, function() {
                        $window.trigger("resize");
                    });
                });
            }
        }
        if (plugins.copyrightYear.length) {
            plugins.copyrightYear.text(initialDate.getFullYear());
        }
        if (plugins.bootstrapDateTimePicker.length) {
            for (var i = 0; i < plugins.bootstrapDateTimePicker.length; i++) {
                var $dateTimePicker = $(plugins.bootstrapDateTimePicker[i])
                  , options = {
                    date: $dateTimePicker.attr("data-time-picker") === "date",
                    time: $dateTimePicker.attr("data-time-picker") === "time",
                    shortTime: true

                };
                if (options.date) {
                    options['format'] = 'DD/MM/YY';
                    options['minDate'] = new Date();
                    
                } else if (options.time) {
                    options.format = 'HH:mm';
                } else {
                    options.format = 'dddd DD MMMM YYYY - HH:mm';
                }
                $dateTimePicker.bootstrapMaterialDatePicker(options);
            }
        }
        if (plugins.selectFilter.length) {
            var i;
            for (i = 0; i < plugins.selectFilter.length; i++) {
                var select = $(plugins.selectFilter[i]);
                select.select2({
                    placeholder: select.attr("data-placeholder") ? select.attr("data-placeholder") : false,
                    minimumResultsForSearch: select.attr("data-minimum-results-search") ? select.attr("data-minimum-results-search") : -1,
                    maximumSelectionSize: 3
                });
            }
        }
        if (plugins.bootstrapTabs.length) {
            for (var i = 0; i < plugins.bootstrapTabs.length; i++) {
                var bootstrapTab = $(plugins.bootstrapTabs[i]);
                if (bootstrapTab.find('.slick-slider').length) {
                    bootstrapTab.find('.tabs-custom-list > li > a').on('click', $.proxy(function() {
                        var $this = $(this);
                        var setTimeOutTime = isNoviBuilder ? 1500 : 300;
                        setTimeout(function() {
                            $this.find('.tab-content .tab-pane.active .slick-slider').slick('setPosition');
                        }, setTimeOutTime);
                    }, bootstrapTab));
                }
                plugins.bootstrapTabs[i].querySelectorAll('.nav li a').forEach(function(tab, index) {
                    if (index === 0) {
                        tab.parentElement.classList.remove('active');
                        $(tab).tab('show');
                    }
                    tab.addEventListener('click', function(event) {
                        event.preventDefault();
                        $(this).tab('show');
                    });
                });
            }
        }
    });
}());
(function($) {
    var o = $('.rd-navbar');
    if (o.length > 0) {
        $(document).ready(function() {
            o.RDNavbar({
                stuckWidth: 768,
                stuckMorph: true,
                stuckLayout: "rd-navbar-static",
                responsive: {
                    0: {
                        layout: 'rd-navbar-fixed',
                        focusOnHover: false,
                        anchorNavOffset: -56
                    },
                    768: {
                        layout: 'rd-navbar-fullwidth',
                        anchorNavOffset: -78
                    },
                    1200: {
                        layout: o.attr("data-rd-navbar-lg").split(" ")[0],
                    }
                },
                onepage: {
                    enable: false,
                    offset: 0,
                    speed: 400,
                    anchorNavOffset: 0
                }
            });
        });
    }
}
)(jQuery);
;(function($) {
    var o = $('.responsive-tabs');
    if (o.length > 0) {
        $(document).ready(function() {
            o.each(function() {
                var $this = $(this);
                $this.easyResponsiveTabs({
                    type: $this.attr("data-type") === "accordion" ? "accordion" : "default"
                });
            })
        });
    }
}
)(jQuery);
