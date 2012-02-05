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
    }
});

EME.SelectedPhotoView = Em.View.extend({

});
