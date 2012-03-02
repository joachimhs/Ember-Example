EME = Ember.Application.create({
    ready: function() {
        this._super();
    }
});

EME.Adapter = DS.Adapter.create({
    findAll: function(store, type) {
        var url = type.url;

        jQuery.getJSON(url, function(data) {
            // data is a Hash of key/value pairs. If your server returns a
            // root, simply do something like:
            //   store.load(type, id, data.person)
            store.loadMany(type, data);
        });
    }
});

EME.store = DS.Store.create({
    adapter: EME.Adapter
});


