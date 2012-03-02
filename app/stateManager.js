setTimeout(function() {

    EME.stateManager = Ember.StateManager.create({
        rootElement: '#mainArea',
        initialState: 'showPhotoView',

        showPhotoView: Ember.ViewState.create({
            enter: function(stateManager) {
                this._super(stateManager);
                EME.PhotoListController.set('content', EME.store.findAll(EME.Photo));
            },

            view: Em.ContainerView.create({
                childViews: ['photoListView', 'controlButtoniew', 'selectedPhotoView'],

                photoListView: Em.View.extend({
                    templateName: 'photo-view-list',
                    contentBinding: 'EME.PhotoListController.content',
                    classNames: ['thumbnailViewList']
                }),

                selectedPhotoView: Em.View.extend({
                    templateName: 'selected-photo',
                    contentBinding: 'EME.SelectedPhotoController.content',
                    classNames: ['selectedPhoto']
                }),

                controlButtoniew: Em.View.extend({
                    templateName: 'control-button-view',
                    classNames: 'controlButtons'
                })
            })
        })
    });

}, 50);