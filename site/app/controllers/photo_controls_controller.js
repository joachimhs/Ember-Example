EME.PhotoControlsController = Ember.Controller.extend({
    needs: ['photos', 'photosSelectedPhoto'],
    slideshowTimerId: null,

    playSlideshow: function() {
        console.log('playSlideshow');
        var controller = this;
        controller.nextPhoto();
        this.set('slideshowTimerId', setInterval(function() {
            Ember.run(function() {
                controller.nextPhoto();
            });
        }, 4000));
    },

    stopSlideshow: function() {
        console.log('stopSlideshow');
        clearInterval(this.get('slideshowTimerId'));
        this.set('slideshowTimerId', null);
    },

    nextPhoto: function() {
        console.log('nextPhoto');
        this.get('controllers.photos').nextPhoto();
    },

    prevPhoto: function() {
        console.log('prevPhoto');
        this.get('controllers.photos').prevPhoto();
    }
});