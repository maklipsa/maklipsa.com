/*!
 * Galleria Classic Theme
 * http://galleria.aino.se
 *
 * Copyright (c) 2010, Aino
 * Licensed under the MIT license.
 */

(function($) {
Galleria.addTheme({
    name: 'custom',
    author: 'saygon',
    version: '1.2',
    //css: 'galleria.custom.css',
    defaults: {
        transition: 'slide',
        show_caption: false,
        image_crop: false,
        frame: true,
        frame_color: '#fff',
        hide_dock: true,
        autoplay: 4000
    },
    init: function (options) {
        //this.$('loader').show().fadeTo(200, .4);
        //this.$('counter').show().fadeTo(200, .4);
        
        this.$('thumbnails').children().hover(function() {
            $(this).not('.active').children().stop().fadeTo(100, 1);
        }, function() {
            $(this).not('.active').children().stop().fadeTo(400, .4);
        }).not('.active').children().css('opacity',.4);
        
        // this.$('container').hover(this.proxy(function() {
        //     this.$('image-nav-left,image-nav-right,counter').fadeIn(200);
        // }), this.proxy(function() {
        //     this.$('image-nav-left,image-nav-right,counter').fadeOut(500);
        // }));
        /*this.setStyle(this.$('galleria-container'), {
            height: '600px;'
        });
        */
        //this.$('image-nav-left,image-nav-right,counter').hide();
        
        var elms = this.$('info-link,info-close,info-text').click(function() {
            elms.toggle();
        });
        
        if (options.show_caption) {
            elms.trigger('click');
        }
        
        this.bind(Galleria.LOADSTART, function(e) {
            //if (!e.cached) {
            //    this.$('loader').show().fadeTo(200, .4);
            //}
            //if (this.hasInfo()) {
            //    this.$('info').show();
            //} else {
            //    this.$('info').hide();
            //}
        });

        //this.bind(Galleria.LOADFINISH, function(e) {
        //    this.$('loader').fadeOut(200);
        //});
        //this.bind(Galleria.LOADSTART, function(e) {
        //    $(e.thumbTarget).css('opacity',1).parent().addClass('active')
        //        .siblings('.active').removeClass('active').children().css('opacity',.4);
        //})
        this.attachKeyboard({
            left: this.prev,
            right: this.next
            //,up: function (e) {
            //    if (!open) {
            //        tc.trigger('mouseover');
            //    }
            //    e.preventDefault();
            //},
            //down: function (e) {
            //    tc.trigger('mouseout');
            //    e.preventDefault();
            //}
        });
    }
});

})(jQuery);