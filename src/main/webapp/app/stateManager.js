setTimeout(function() {
    EME.generateImages();

    EME.stateManager = Ember.StateManager.create({
        rootElement: '#mainArea',
        initialState: 'showPhotoView',

        showPhotoView: Ember.ViewState.create({
            enter: function(stateManager) {
                this._super(stateManager);
                EME.PhotoListController.set('content', EME.store.findAll(EME.Photo));
            },

            view: Em.ContainerView.create({
                childViews: ['photoListView'],

                photoListView: Em.View.extend({
                    templateName: 'photo-view-list',
                    contentBinding: 'EME.PhotoListController.content',
                    classNames: ['thumbnailViewList']
                })
            })
        })
    });

}, 50);