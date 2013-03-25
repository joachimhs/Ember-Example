EME.Router.map(function() {
	this.route("index", {path: "/"});
    this.resource("photos", {path: "/photos"}, function() {
        this.route("selectedPhoto", {path: ":photo_id"})
    });
});

EME.IndexRoute = Ember.Route.extend({
    redirect: function() {
        this.transitionTo('photos');
    }
});

EME.PhotosRoute = Ember.Route.extend({
    model: function() {
        return EME.Photo.find();
    }
});