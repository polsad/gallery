define([
	
    'backbone',
    'spinners',
    'mixins/data-options',

], function(Backbone, Spinners, DataOptions) {
    var Gallery = Backbone.View.extend({
        // Queue for images
        queue: [],    
        action: false,
        
		options: {
            photo: {
                box : '.photo-box',
                item: '.image'
            },
            preview: {
                box : '.preview-box',
                viewport : '.preview-viewport',
                item: '.preview'
            }
		},        
    
        initialize: function() {
            this.parseOptions();
            this.initSize();
        },
        
        initSize: function() {
            var self = this;
            
            // Start size
            this.$el.find(this.options.photo.box).width(this.options.photoWidth+'%');
            this.$el.find(this.options.preview.box).width(100 - this.options.photoWidth+'%');
            this.$el.find(this.options.preview.viewport).css('paddingLeft', this.options.previewMargin);
            this.$el.find(this.options.preview.item).css({marginRight: this.options.previewMargin, marginBottom: this.options.previewMargin})        
            this.$el.find(this.options.preview.item + ':nth-child(' + this.options.previewCols + 'n)').css({marginRight: 0});  

            $(window).on('resize.gallery', function() {
                self.resizeSize();
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
            
            // Click event
            $(this.options.preview.item).click(function() {
                // Photo loaded yet
                if ($(this).is('.loading') == false) {
                    self.showImage($(this).index());
                    
                }
            });
        },
        
        resizeSize: function() {
            // Width for viewport
            this.$el.find(this.options.preview.viewport).css({width: this.$el.find(this.options.preview.box).width()});
            // Height for gallery
            $(this.el).height(parseInt(this.$el.find(this.options.photo.box).width() / 1.5));
            // Width and height for item
            var w = Math.floor((this.$el.find(this.options.preview.viewport).width() - (this.options.previewCols - 1) * this.options.previewMargin) / this.options.previewCols);
            this.$el.find(this.options.preview.item).css({width: w, height: w});
        },
        
        createQueue: function() {
            var self = this;
            var a = [];
            var b = [];
            var j = 0;
            
            this.$el.find(this.options.photo.item).each(function() {
                a.push(this);
            });
            this.$el.find(this.options.preview.item).each(function() {
                b.push(this);
            });            
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
            this.$el.find(this.options.preview.item).on('load.gallery', function() {
                self.loadQueueItem();
            });            
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
                    // Remove loading class (fade in transition effect)
                    $(box).removeClass('loading').addClass('loaded');
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
                if (next.is('.loading')) {
                    // Find next photo in queue and move it to start queue
                    var i = _.indexOf(self.queue, next[0]);
                    var a = self.queue.slice(0, i)
                    var b = self.queue.slice(i, i + 1)
                    var c = self.queue.slice(i + 1)
                    
                    self.queue = _.union(b, a, c);
                    i = a = b = c = undefined;
                }
                self.$el.find(self.options.photo.item+':visible').fadeOut(self.options.photoEffectTime, function() {
                    next.fadeIn(self.options.photoEffectTime, function() {
                        self.action = false;
                    });
                });
            }
        },
        

        render: function() {
            return this;
        }
    });
    
    _.extend(Gallery.prototype, DataOptions);
    
    return Gallery;
});