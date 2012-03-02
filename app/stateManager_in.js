setTimeout(function() {
    console.log('oppretter testdata');
    EME.generateImages();

    EME.stateManager = Ember.StateManager.create({
        rootElement: '#mainArea',
        initialState: 'visBildeoversikt',

        visBildeoversikt: Ember.ViewState.create({
            view: Em.ContainerView.create({
                childViews: ['imageListView', 'imageView'],

                imageListView: Em.View.extend({
                    enter: function() {
                        this._super();
                        EME.PhotoListController.set('content', EME.store.findAll(EME.Photo));
                    },

                    templateName: 'image-view-list',
                    contentBinding: 'SCT.ImageListController'
                }),

                imageView: Em.View.extend({
                    templateName: 'image-view',
                    contentBinding: 'SCT.SelectedImageController.content'
                })
            })
        })
    });

}, 50);