/* ArtZoom v0.1 - A light-weight, customizable image zoom plugin for jQuery with colorbox integration
 *
 * Copyright (c) 2011 Sergio Toro - sergio@art4websites.com
 * Pluguin url: http://blog.art4websites.com/artzoom-simple-image-zoom-para-jquery
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */
(function($){
    $.fn.artzoom = function(options){
        var s = {
            top: 0,
            left: 'auto',
            width: 'auto',
            height: 'auto',
            distance: 25,
            zIndex: 100,
            update: 35,
            enableGallery: true,
            galleryMargin: 5,
            gallerySpeed: 250,
            showControls: true,
            prevText: '&laquo;',
            nextText: '&raquo;',
            colorboxIntegration: true,
            colorboxLabel: 'click on image to enlarge',
            colorboxOptions: {
                maxWidth: '80%',
                maxHeight: '95%',
                rel: 'az-gallery'
            }
        };
        return this.each(function(){
            if( options )
                $.extend(true,s,options);

            var $this = $(this);
            var galleryEnabled = s.enableGallery;
            var $main = $('> a',$this);
            if ($main.length == 1)
                galleryEnabled = false;
            else if($main.length > 1)
                $main = $($main[0]);

            if (galleryEnabled)
                $main.after($main.clone());
            $main.addClass('az-main');
            // THUMBNAIL
            var maData = $main.data();
            var thumbTitle;
            var thumb;
            var $thumb;

            // GALERIA
            var $gallery = $('> a',$this).not('.az-main');
            var $galleryImgs;
            var $galleryCarrusel;
            var $galleryControls;
            var $galleryOuter;
            var galleryCurrentItem = 0
            var galImgsWidth;
            var galImgsHeight;
            var galleryItemWidth;
            var galleryVisibleItems;

            // COLORBOX
            var $colorboxTrigger;
            var colorboxInited = false;
            var colorboxTimeout;

            // ZOOM
            var imgZoom;
            var azZoomWidth;
            var azZoomHeight;
            var thWidth;
            var thHeight;
            var zoomWidth;
            var zoomHeight;
            var ratioX;
            var ratioY
            var x;
            var y;

            var artZoomInterval;
            var artZoomHover = false;
            var artZoomInited = false;
            var artZoomReady = false;

            var $zoomContainer = $('<div class="az-zoom az-loading"/>');

            $this
            .addClass('az-container')
            .css('zIndex',parseInt(s.zIndex))
            .append($zoomContainer);

            $main
            .addClass('az-cursor')
            .click(function(e){
                e.preventDefault();
            })
            .mouseover(function(e){
                show();
                if (s.colorboxIntegration && colorboxInited){
                    clearTimeout(colorboxTimeout);
                    colorboxTimeout = setTimeout(function(){
                        $colorboxTrigger.show();
                    },250);
                }
            })
            .mouseout(function(){
                hide();
                if (s.colorboxIntegration && colorboxInited){
                    clearTimeout(colorboxTimeout);
                    colorboxTimeout = setTimeout(function(){
                        $colorboxTrigger.hide();
                    },150);
                }
            })
            .mousemove(function(e){
                x = e.pageX;
                y = e.pageY;
            });
            // Si integramos el plugin con colorbox
            if (s.colorboxIntegration)
                initColorbox();

            // Si existe galería...
            if($gallery.length && galleryEnabled)
                setupGallery();
            // Set up plugin
            thumb = new Image();
            thumb.src = maData.bigThumb;
            thumbTitle = (maData.title ? maData.title : '');
            setup();

            /*******************************************************************
             * FUNCIONES
             ******************************************************************/
            function setup(){
                // Cuando la miniatura este cargada iniciar el plugin
                if (!thumb || img_error(thumb)){
                    setTimeout(setup,200);
                    return;
                }
                $thumb = $(thumb);
                $thumb.attr('title',thumbTitle);

                $main.html('').append($thumb);

                thWidth = thumb.naturalWidth;
                thHeight = thumb.naturalHeight;


                $this.width(thWidth);

                azZoomWidth = (s.width == 'auto' ? thWidth : parseInt(s.width));
                azZoomHeight = (s.height == 'auto' ? thHeight : parseInt(s.height));

                $zoomContainer.css({
                    'width': azZoomWidth+'px',
                    'height': azZoomHeight+'px',
                    'top': parseInt(s.top)+'px',
                    'left': (s.left == 'auto' ? thWidth + parseInt(s.distance) : parseInt(s.left))+'px'
                });
            }
            function show(){
                artZoomHover = true;
                $zoomContainer.show();
                artZoomInterval = setInterval(move,s.update);
                // Si no esta iniciada la imagen de zoom
                if (artZoomInited)
                    return;
                init();
            }
            function init(){
                imgZoom = new Image()
                imgZoom.src = $main.attr('href');

                setupZoom();
                artZoomInited = true;
            }
            function setupZoom(){
                if (!imgZoom || img_error(imgZoom)){
                    setTimeout(setupZoom,200);
                    return;
                }
                $zoomContainer
                .css('background','url("'+imgZoom.src+'") no-repeat 50% 50%')
                .removeClass('az-loading');

                zoomWidth = imgZoom.naturalWidth -azZoomWidth;
                zoomHeight = imgZoom.naturalHeight -azZoomHeight;


                ratioX = zoomWidth/thWidth;
                ratioY = zoomHeight/thHeight;

                artZoomReady = true;
                move();
            }
            function hide(){
                if (!artZoomReady)
                    return;
                clearInterval(artZoomInterval);
                $zoomContainer.hide();
                artZoomHover = false;
            }
            function move(){
                if (!artZoomHover || !artZoomReady)
                    return;
                var offset = $thumb.offset();
                var pX = x - offset.left;
                var pY = y - offset.top;
                var zoomX = pX*ratioX;
                var zoomY = pY*ratioY;
                zoomX = (zoomX > zoomWidth) ? zoomWidth : zoomX;
                zoomY = (zoomY > zoomHeight) ? zoomHeight : zoomY;

                $zoomContainer.css({
                    'background-position': -zoomX + 'px '+ -zoomY + 'px'
                });
            }

            function setupGallery(){
                // Esperar a que este cargado el thumbnail para cargar la galería
                if (!thWidth){
                    setTimeout(setupGallery,200);
                    return;
                }
                $.each($gallery,function(){
                    var $this = $(this);
                    var data = $this.data();
                    $this.append($('<img src="'+data.smallThumb+'" title="'+(data.title ? data.title : '')+'" />'));
                });
                $galleryOuter = $('<div class="az-gal-relative"/>');
                $galleryControls = $('<a href="javascript:;" class="az-gal-control az-disabled az-gal-prev" data-type="previous">'+s.prevText+'</a><a href="javascript:;" class="az-gal-control az-gal-next" data-type="next">'+s.nextText+'</a>');
                $galleryImgs = $('img',$gallery);

                $gallery
                .addClass('az-gallery az-gal-trig')
                .wrap($('<li class="az-gal-item"></li>')).parent()
                .wrapAll($('<div class="az-gal-container"><ul class="az-gal-carrusel"></ul></div>"'))
                .parent().parent()
                .appendTo($galleryOuter);

                $galleryCarrusel = $('ul.az-gal-carrusel',$galleryOuter);
                $galleryOuter.append($galleryControls);

                $('li.az-gal-item:not(:last)',$galleryCarrusel).css('margin-right',s.galleryMargin + 'px');

                $this.append($galleryOuter);

                // Iniciar la galería
                initGallery();

                $gallery.click(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    var $this = $(this);
                    var data = $this.data();

                    if(data.bigThumb == $thumb.attr('src'))
                        return;

                    if(s.showControls)
                        $galleryControls.hide();

                    $thumb = null;
                    thWidth = false;
                    thumb = new Image();
                    thumb.src = data.bigThumb;
                    thumbTitle = (data.title ? data.title : '');
                    $main.attr('href',$this.attr('href'));

                    $zoomContainer
                    .css('background','#FFF')
                    .addClass('az-loading');

                    artZoomInited = false;
                    artZoomReady = false;

                    setup();
                    initGallery();
                });
                $galleryControls.click(function(){
                    var $this = $(this);
                    var data = $this.data();
                    var pos = false;

                    $galleryControls.removeClass('az-disabled');
                    switch(data.type){
                        case 'previous':
                            pos = 0;
                            if (galleryCurrentItem-galleryVisibleItems > 0)
                                pos = galleryCurrentItem-galleryVisibleItems;
                            else
                                $this.addClass('az-disabled');
                            break;
                        case 'next':
                            pos = $gallery.length-galleryVisibleItems;
                            if (galleryCurrentItem+galleryVisibleItems < $gallery.length-galleryVisibleItems)
                                pos = galleryCurrentItem+galleryVisibleItems;
                            else
                                $this.addClass('az-disabled');
                            break;
                    }
                    if (pos === false)
                        return;
                    galleryCurrentItem = pos;
                    $galleryCarrusel.animate({
                        'left':(galleryCurrentItem * galleryItemWidth * -1) + 'px'
                    },s.gallerySpeed);
                });
            }
            function initGallery(){
                var error = false;
                $.each($galleryImgs,function(){
                    if(img_error(this))
                        error = true;
                });
                if (!thWidth || error){
                    setTimeout(initGallery,200);
                    return;
                }
                galImgsWidth = $galleryImgs.width();
                galImgsHeight = $galleryImgs.height();
                var $galleryInner = $('div.az-gal-container',$galleryOuter);
                var commonDimensions = {
                    'width': thWidth+'px',
                    'height': galImgsHeight+'px'
                };
                $galleryInner.css(commonDimensions);
                $galleryOuter.css(commonDimensions);
                $galleryCarrusel.css({
                    'width': (galImgsWidth*$gallery.length)+(($gallery.length-1)*s.galleryMargin)+'px',
                    'height': galImgsHeight+'px'
                });
                galleryItemWidth = galImgsWidth + s.galleryMargin;
                galleryVisibleItems = Math.floor(thWidth/galImgsWidth);

                if (s.showControls){
                    if ($gallery.length <= galleryVisibleItems)
                        $galleryCarrusel.css('left','0px');
                    else
                        $galleryControls.show();
                }
            }
            function initColorbox(){
                if($.type($.colorbox) !== 'function'){
                    colorboxInited = false;
                    return;
                }
                $colorboxTrigger = $('<a href="javascript:;" class="az-colorbox-trigger"><span class="az-colorbox-text">'+(s.colorboxLabel ? s.colorboxLabel : '&nbsp')+'</span></a>');
                $this.append($colorboxTrigger);

                $gallery.colorbox(s.colorboxOptions);
                colorboxInited = true;

                $colorboxTrigger.click(function(){
                    var options = {
                        href: $main.attr('href')
                    };
                    $.extend(true,options,s.colorboxOptions);
                    $.colorbox(options);
                })
                .mouseover(function(){
                    clearTimeout(colorboxTimeout);
                    $colorboxTrigger.show();
                })
                .mouseout(function(){
                    colorboxTimeout = setTimeout(function(){
                        $colorboxTrigger.hide();
                    },50);
                });
            }
            function img_error(img){
                if (!img.complete || (typeof img.naturalWidth != "undefined" && img.naturalWidth== 0))
                    return true;
                return false;
            }
        });
    };
})(jQuery);