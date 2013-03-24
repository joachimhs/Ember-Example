EME.PhotosController = Ember.ArrayController.extend({
    needs: ['photosSelectedPhoto'],

    selectPhotoAction: function(photo) {
        console.log('selectPhoto: ' + photo.get('id'));
        this.set('selectedPhoto', photo);
    },

    nextPhoto: function() {
        var selectedPhoto = null;
        console.log(this.get('controllers.photosSelectedPhoto'));
        console.log(this.get('controllers.photosSelectedPhoto.content'));
        if (!this.get('controllers.photosSelectedPhoto.content')) {
            console.log('controllers.photosSelectedPhoto.content is null');
            selectedPhoto = this.get('content.firstObject');
            this.transitionToRoute("photos.selectedPhoto", selectedPhoto);
        } else {
            console.log('finding next photo');
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
        if (!this.get('selectedPhoto')) {
            this.set('selectedPhoto', this.get('controllers.photos.content').get('lastObject'));
        } else {
            var selectedIndex = this.findSelectedItemIndex();

            if (selectedIndex <= 0) {
                selectedIndex = this.get('controllers.photos.content').get('length') - 1;
            } else {
                selectedIndex--;
            }

            this.set('selectedPhoto', this.get('controllers.photos.content').objectAt(selectedIndex));
        }
    },

    findSelectedItemIndex: function() {
        var content = this.get('content');
        var selectedPhoto = this.get('controllers.selectedPhoto.content');

        for (index = 0; index < content.get('length'); index++) {
            if (this.get('selectedPhoto') === content.objectAt(index)) {
                return index;
            }
        }

        return 0;
    }
});