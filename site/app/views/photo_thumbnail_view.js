EME.PhotoThumbnailView = Ember.View.extend({
    tagName: 'img',
    attributeBindings: ['src'],
    classNames: ['thumbnailItem'],
    classNameBindings: 'isSelected',

    isSelected: function() {
        return this.get('content.id') === this.get('controller.controllers.photosSelectedPhoto.content.id');
    }.property('controller.controllers.photosSelectedPhoto.content', 'content')
});