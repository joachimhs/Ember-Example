EME = Ember.Application.create({
    ready: function() {
        this._super();
    }
});

EME.store = DS.Store.create();