define([
	
    'backbone',
    'spinners',
    'mixins/data-options',
    'mousewheel'

], function(Backbone, Spinners, DataOptions) {
    var Gallery = Backbone.View.extend({
        // Queue for images
        queue: [],    
        action: false,
        timer: null,
        timerResize: null,
        timerTime: 0,
        
		options: {
            photo: {
                box : '.photo-box',
                wrapper: '.photo-box-wrapper',
                item: '.image'
            },
            preview: {
                box : '.preview-box',
                viewport : '.preview-viewport',
                item: '.preview',
				viewCount: 0,
				viewLimit: 0,
				rowsCount: 0,
                itemCount: 0,
				height: 0
            },
            slideshow: {
                time : 0,
                status: 'stop',
                timer: null
            },
            scroll: {
                action: false,
                delta: 0,
                h1: 0,
                h2: 0
            },
            arrows: {
                prev: '.photo-box-prev',
                next: '.photo-box-next'
            }
		},        
    
		events: {
			'mousewheel .preview-box': 'onMousewheel'
		},
    
        initialize: function() {
            this.parseOptions();
            this.initSize();
        },
        
        initSize: function() {
            var self = this;
           
            // Slideshow
            this.options.slideshow.time = (this.options.slideshowTime == undefined) ? 0 : parseInt(this.options.slideshowTime);
            this.options.slideshow.status = (this.options.slideshow.time > 0) ? 'start' : 'stop';
            
            // First image 
            this.$el.find(this.options.photo.item+':first-child').css('display','block');
            
            // Start size
            // With previews
            if (self.options.previewEnable == true) {
                this.$el.find(this.options.photo.box).width(this.options.photoWidth+'%');
                this.$el.find(this.options.photo.wrapper).width(this.$el.find(this.options.photo.box).width());
                
                this.$el.find(this.options.preview.box).width(100 - this.options.photoWidth+'%');
                if (this.options.previewPosition == 'right') {
                    this.$el.find(this.options.preview.viewport).css('paddingLeft', this.options.previewMargin);
                }
                else {
                    this.$el.find(this.options.preview.viewport).css('paddingRight', this.options.previewMargin);
                }
                this.$el.find(this.options.preview.item).css({marginRight: this.options.previewMargin, marginBottom: this.options.previewMargin})        
                this.$el.find(this.options.preview.item + ':nth-child(' + this.options.previewCols + 'n)').css({marginRight: 0});  
            }
            // Without preview
            else {
                this.$el.find(this.options.photo.box).width('100%');
            }
            
            if (this.options.arrowsEnable == true) {
                this.$el.find(this.options.arrows.prev).click(function() {
                    self.prevSlide();
                });
                this.$el.find(this.options.arrows.next).click(function() {
                    self.nextSlide();
                });
            }
            
            $(window).on('resize.gallery', function() {
                // Width for wrapper
                self.$el.find(self.options.photo.wrapper).width(self.$el.find(self.options.photo.box).width());
                
                if (self.options.previewEnable == true) {
                    self.resizeSize();
                    // Resize preview
                    self.$el.find(self.options.preview.item + ' img').each(function() {
                        self.setImageSize(this, 1, 'out');
                    }); 
                    self.fixViewportTop();
                }
                else {
                    $(self.el).height(parseInt(self.$el.find(self.options.photo.box).width() / 1.5));
                }
                self.$el.find(self.options.photo.item + ' img').each(function() {
                    self.setImageSize(this, 1.5, self.options.imagePosition);
                });
            }).trigger('resize.gallery');
            
            // Create queue
            this.createQueue();
            
            // Create spinner
            Spinners.create(this.$el.find(this.options.photo.item + ' .spinner'), {
                radius: 7,
                height: 10,
                width: 1.5,
                dashes: 20,
                opacity: 0.85,
                rotation: 800,
                color: '#000000'
            }).center().play();        
            
            if (self.options.previewEnable == true) {
                $(this.options.preview.item).click(function() {
                    // Photo loaded yet
                    if ($(this).is('.loading') == false) {	
                        window.clearInterval(self.options.slideshow.timer);                
                        self.options.slideshow.status = 'stop';
                        self.showImage($(this).index());
                    }
                });
            }
            $(this.options.photo.item).click(function() {
                // Photo loaded yet
                if ($(this).is('.loading') == false) {
                    self.nextSlide();
                }
            });            
        },
        
        resizeSize: function() {
            // Width for viewport
            this.$el.find(this.options.preview.viewport).css({width: this.$el.find(this.options.preview.box).width()});
            // Height for gallery
            $(this.el).height(parseInt(this.$el.find(this.options.photo.box).width() / 1.5));
            // Width and height for item
            var w = this.options.preview.height = Math.floor((this.$el.find(this.options.preview.viewport).width() - (this.options.previewCols - 1) * this.options.previewMargin) / this.options.previewCols);
            this.$el.find(this.options.preview.item).css({width: w, height: w});
			// For scrolling
            this.options.scroll.delta = w + this.options.previewMargin;
            this.options.scroll.h1 = this.$el.find(this.options.preview.box).height();
            this.options.scroll.h2 = this.$el.find(this.options.preview.viewport).height() - this.options.previewMargin;
           
            // Visible rows
			this.options.preview.viewCount = Math.ceil(this.$el.find(this.options.preview.box).height() / (w + this.options.previewMargin));
            // Rows limit in top 
			this.options.preview.viewLimit = parseInt(this.options.preview.viewCount / 2);
			this.options.preview.viewLimit = this.options.preview.viewLimit + this.options.preview.viewCount % 2;
            // Rows count
            this.options.preview.itemCount = this.$el.find(this.options.preview.item).size();
			this.options.preview.rowsCount = Math.ceil(this.$el.find(this.options.preview.item).size() / this.options.previewCols);
        },
        
        createQueue: function() {
            var self = this;
            var a = [];
            var b = [];
            var j = 0;
            
            this.$el.find(this.options.photo.item).each(function() {
                a.push(this);
            });
            if (self.options.previewEnable == true) {
                this.$el.find(this.options.preview.item).each(function() {
                    b.push(this);
                });   
            }
            
            for (i in a) {
                // Photo
                this.queue.push(a[i]);
                if (j <= b.length) {
                    // Preview
                    this.queue = _.union(this.queue, b.slice(j, j + this.options.queueRate));
                    j = j + this.options.queueRate;
                }
                
            }
            a = b = undefined;
            
            this.$el.find(this.options.photo.item).on('load.gallery', function() {
                 self.loadQueueItem();
            });
            
            if (self.options.previewEnable == true) {
                this.$el.find(this.options.preview.item).on('load.gallery', function() {
                    self.loadQueueItem();
                });
            }
			            
            self.loadQueueItem();
        },
        
        loadQueueItem: function() {
            var self = this;
            if (self.queue.length > 0) {
                var box = self.queue.shift();
                var img = $(box).find('img');
                var spinner = $(box).find('.spinner');

                $(img).attr('src', $(img).attr('data-src')).on('load error', function() {
                    // Remove spinner
                    spinner.remove();
                    // Set image position and scale
                    if ($(img).data('type') == 'photo') 
                        self.setImageSize(this, 1.5, self.options.imagePosition)
                    else 
                        self.setImageSize(this, 1, 'out')
                    // Remove loading class (fade in transition effect)
                    $(box).removeClass('loading').addClass('loaded');
                    // Start slideshow
                    if (self.options.slideshow.status == 'start' && $(box).index() == 0 && $(img).data('type') == 'photo') {
                        self.startSlideshow();
                    }
                    // Slideshow status = wait
                    if (self.options.slideshow.status == 'wait' && $(box).index() > 0 && $(img).data('type') == 'photo') {
                        self.options.slideshow.status = 'start';
                        self.showImage($(box).index());
                    }                    
                    // Load next image
                    $(box).trigger('load.gallery');
                });
            }
        },
        
        showImage: function(id) {
            if (this.action == false) {
                var self = this;
                self.action = true;
                
                var next = self.$el.find(self.options.photo.item).eq(id);
                var curr = self.$el.find(self.options.photo.item+':visible');
				
                if (curr.index() != id && next.size() == 1) {
                    if (next.is('.loading')) {
                        // Find next photo in queue and move it to start queue
                        var i = _.indexOf(self.queue, next[0]);
                        var a = self.queue.slice(0, i)
                        var b = self.queue.slice(i, i + 1)
                        var c = self.queue.slice(i + 1)
                        
                        self.queue = _.union(b, a, c);
                        i = a = b = c = undefined;
                    }
                    curr.fadeOut(self.options.photoEffectTime, function() {
                        // Move previews
						if (self.options.previewEnable == true) {
                            
                            self.$el.find(self.options.preview.item).eq(curr.index()).removeClass('active');
                            self.$el.find(self.options.preview.item).eq(id).addClass('active');
                            
                            if (self.options.preview.rowsCount >= self.options.preview.viewCount) {
                                // Next row
                                var row = Math.floor(id / self.options.previewCols) + 1;
                                
                                // Top for preview viewport
                                var delta = 0;
                                
                                if (row <= self.options.preview.viewLimit) {
                                    delta = 0;
                                }
                                else if (row > self.options.preview.rowsCount - self.options.preview.viewLimit) {
                                    delta = self.options.preview.rowsCount - self.options.preview.viewCount;
                                }
                                else {
                                    delta = (row - self.options.preview.viewLimit) 
                                }
                                
                                delta *= (self.options.preview.height + self.options.previewMargin);

                                if (row == self.options.preview.rowsCount) {
                                    var h1 = $(self.options.preview.viewport).height();
                                    var h2 = (self.options.preview.rowsCount - self.options.preview.viewCount) * (self.options.preview.height + self.options.previewMargin) + $(self.options.preview.box).height();
                                    if (h1 > h2)
                                        delta += h1 - h2 - self.options.previewMargin;
                                }

                                $(self.options.preview.viewport).animate({top: '-'+delta+'px'}, self.options.photoEffectTime);	
                            }
						}
                        
						next.fadeIn(self.options.photoEffectTime, function() {
                            if (self.options.slideshow.status == 'start') {
                                self.startSlideshow();
                            }
                            self.action = false;
                        }).trigger('render:show');
                    });
                }
                else {
                    self.action = false;
                }
            }
        },
        
        fixViewportTop: function() {
            var self = this;
            if (self.options.preview.rowsCount >= self.options.preview.viewCount) {
                // Next row
                var id = self.$el.find(self.options.photo.item+':visible').index();
                var row = Math.floor(id / self.options.previewCols) + 1;
                // Top for preview viewport
                var delta = 0;
                
                if (row <= self.options.preview.viewLimit) {
                    delta = 0;
                }
                else if (row > self.options.preview.rowsCount - self.options.preview.viewLimit) {
                    delta = self.options.preview.rowsCount - self.options.preview.viewCount;
                }
                else {
                    delta = (row - self.options.preview.viewLimit) 
                }
                
                delta *= (self.options.preview.height + self.options.previewMargin);

                if (row == self.options.preview.rowsCount) {
                    var h1 = $(self.options.preview.viewport).height();
                    var h2 = (self.options.preview.rowsCount - self.options.preview.viewCount) * (self.options.preview.height + self.options.previewMargin) + $(self.options.preview.box).height();
                    if (h1 > h2)
                        delta += h1 - h2 - self.options.previewMargin;
                }

                $(self.options.preview.viewport).css({top: '-'+delta+'px'});	
            }        
        },
        
        /**
         * img - image
         * rate - image wrapper size rate
         * type - in / out
         */
        setImageSize: function(img, rate, type) {
            var ci = rate;
            var cw = $(img).parent().data('width') / $(img).parent().data('height');

            if (type == 'in') {
                var c = (ci >= cw) ? 'h' : 'w';
            }
            else {
                var c = (ci >= cw) ? 'w' : 'h';
            }
            $(img).removeClass('w h').addClass(c);
            if (type == 'out') {
                if (c == 'w')
                    $(img).width('100%');
                else
                    $(img).height('100%');
            }
            
            var ww = $(img).parent().width();
            var hw = $(img).parent().height();
			var vw = $(img).parent().is(':visible');
            
            if (vw == false)
                 $(img).parent().css({'visible':'hidden', 'display': 'block'});
            
            var wi = $(img).width();
            var hi = $(img).height();

            if (vw == false)
                $(img).parent().css({'visible':'', 'display': 'none'});
            
            var mt = ml = 0
            if (wi != ww) {
                ml = parseInt((ww - wi) / 2);
            }
            if (hi != hw) {
                mt = parseInt((hw - hi) / 2);
            }    
            $(img).css({
                'marginLeft': ml + 'px',
                'marginTop': mt + 'px'
            });
        },        

        startSlideshow: function() {
            var self = this;
            
            self.options.slideshow.timer = setTimeout(function() {
               self.nextSlideshow();
            }, self.options.slideshow.time);
        },
        
        nextSlideshow: function() {
            var self = this;
            
            var curr = self.$el.find(self.options.photo.item+':visible');
            var next = self.$el.find(self.options.photo.item).eq(curr.index() + 1);

            if (next.size() == 0) {
                self.showImage(0);
            }
            else if (next.is('.loaded')) {
                self.showImage(curr.index() + 1);
            }
            else {
                self.options.slideshow.status = 'wait';
            }            
        },
        
        prevSlide: function() {
            if (this.options.slideshow.status != 'stop') {
                window.clearInterval(this.options.slideshow.timer);
                this.options.slideshow.status = 'stop';
            }
            var id = this.$el.find(this.options.photo.item+':visible').index();
            id = (id == 0) ? this.$el.find(this.options.photo.item).size() - 1 : id - 1;
            this.showImage(id);
        },
        
        nextSlide: function() {
            if (this.options.slideshow.status != 'stop') {
                window.clearInterval(this.options.slideshow.timer);
                this.options.slideshow.status = 'stop';
            }
            var curr = this.$el.find(this.options.photo.item+':visible');
            var next = this.$el.find(this.options.photo.item).eq(curr.index() + 1);
            if (next.size() == 0) {
                this.showImage(0);
            }
            else {
                this.showImage(curr.index() + 1);
            }    
        },
        
        onMousewheel: function(event, delta, deltaX, deltaY) {
            var self = this;
            if (this.options.slideshow.status != 'stop') {
                window.clearInterval(this.options.slideshow.timer);
                this.options.slideshow.status = 'stop';
            }            
            if (self.options.scroll.action == false && self.action == false) {
                self.options.scroll.action = true;
                var top = Math.abs(parseInt(self.$el.find(this.options.preview.viewport).css('top')));
                if (deltaY < 0) {
                    top = top + self.options.scroll.delta;
                    if (top > self.options.scroll.h2 - self.options.scroll.h1) {
                        top = self.options.scroll.h2 - self.options.scroll.h1
                    }
                } else {
                    top = top - self.options.scroll.delta;
                    if (top < 0) 
                        top = 0;
                }      
                self.$el.find(this.options.preview.viewport).animate({top: '-'+top+'px'}, 100, 'linear', function() {self.options.scroll.action = false});              
            }
            return false;
		},
        
        render: function() {
            return this;
        }
    });
    
    _.extend(Gallery.prototype, DataOptions);
    
    return Gallery;
});