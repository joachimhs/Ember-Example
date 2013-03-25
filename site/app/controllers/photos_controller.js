EME.PhotosController = Ember.ArrayController.extend({
    needs: ['photosSelectedPhoto'],

    selectPhotoAction: function(photo) {
        this.set('selectedPhoto', photo);
    },

    nextPhoto: function() {
        var selectedPhoto = null;
        if (!this.get('controllers.photosSelectedPhoto.content')) {
            this.transitionToRoute("photos.selectedPhoto", this.get('content.firstObject'));
        } else {
            var selectedIndex = this.findSelectedItemIndex();

            if (selectedIndex >= (this.get('content.length') - 1)) {
                selectedIndex = 0;
            } else {
                selectedIndex++;
            }

            this.transitionToRoute("photos.selectedPhoto", this.get('content').objectAt(selectedIndex))
        }
    },

    prevPhoto: function() {
        console.log('PhotoListController prevPhoto');
        if (!this.get('controllers.photosSelectedPhoto.content')) {
            this.transitionToRoute("photos.selectedPhoto", this.get('content.lastObject'));
        } else {
            var selectedIndex = this.findSelectedItemIndex();

            if (selectedIndex <= 0) {
                selectedIndex = this.get('content.length') - 1;
            } else {
                selectedIndex--;
            }

            this.transitionToRoute("photos.selectedPhoto", this.get('content').objectAt(selectedIndex))
        }
    },

    findSelectedItemIndex: function() {
        var content = this.get('content');
        var selectedPhoto = this.get('controllers.photosSelectedPhoto.content');

        for (index = 0; index < content.get('length'); index++) {
            if (this.get('controllers.photosSelectedPhoto.content') === content.objectAt(index)) {
                return index;
            }
        }

        return 0;
    }
});