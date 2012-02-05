EME.Photo = DS.Model.extend({
    primaryKey: 'id',
    id: DS.attr('string'),
    photoTitle: DS.attr('string'),
    photoUrl: DS.attr('string')
});

EME.PhotoListController = Em.ArrayProxy.create({
    content: [],
    selected: null
});

EME.SelectedPhotoController = Em.Object.create({
    contentBinding: 'EME.PhotoListController.selected'
});

EME.ThumbnailPhotoView = Em.View.extend({
    click: function(evt) {
        EME.PhotoListController.set('selected', this.get('content'));
    },

    classNameBindings: "isSelected",

    isSelected: function() {
        console.log(EME.PhotoListController.get('selected') == this.get('content'));
        return EME.PhotoListController.get('selected') == this.get('content');
    }.property('EME.PhotoListController.selected')
});

EME.SelectedPhotoView = Em.View.extend({

});
