EME = Ember.Application.create({});

EME.store  = DS.Store.create({
    adapter:  "DS.RESTAdapter",
    revision: 11
});

