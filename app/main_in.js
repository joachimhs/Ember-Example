SCT.ImageListController = Em.ArrayProxy.create({
    content: [],
    selected: null,

    initialiseSelected: function() {
        if (this.get('content')[0]) {
            this.set('selected', this.get('content')[0]);
        }
    },

    findSelectedItemIndex: function() {
        var index = 0;
        var selectedIndex = 0;
        var content = this.get('content');

        $("#output").html('findSelectedItemIndex');
        for (index = 0; index < content.length; index++) {
            var item = content[index];
            if (this.get('selected') === item) {
                $("#output").html('selectNextElement: returnerer index: ' + index);
                selectedIndex = index;
                break;
            }

            $("#output").html('selectNextElement: neste index: ' + index);
        }

        return selectedIndex;
    },

    selectNextElement: function() {
        var selectedIndex = this.findSelectedItemIndex();

        if (selectedIndex >= 9) {
            selectedIndex = 0;
        } else {
            selectedIndex++;
        }

        selectedItem = this.get('content')[selectedIndex]
        this.set('selected', selectedItem);
    },

    selectPrevElement: function() {
        var selectedIndex = this.findSelectedItemIndex();

        if (selectedIndex <= 0) {
            selectedIndex = 9;
        } else {
            selectedIndex--;
        }

        this.set('selected', this.get('content')[selectedIndex]);
    }


});

SCT.SelectedImageController = Em.Object.create({
    contentBinding: 'SCT.ImageListController.selected'
});

SCT.Image = Em.Object.extend({
    imageUrl: null,
    imageTitle: null
});

SCT.PhotoView = Em.View.extend({
    content: null,

    swipeOptions: {
        direction: Em.OneGestureDirection.Left | Em.OneGestureDirection.Right,
        cancelPeriod: 100,
        numberOfRequiredTouches: 2
    },

    swipeEnd: function(recognizer) {
        $("#output").html('swipe: ' + recognizer.swipeDirection);


        if (recognizer.swipeDirection === Em.OneGestureDirection.Left) {
            SCT.ImageListController.selectNextElement();
        } else if (recognizer.swipeDirection === Em.OneGestureDirection.Right) {
            SCT.ImageListController.selectPrevElement();
        }
    },

    tapEnd: function(recognizer) {
        SCT.ImageListController.set('selected', this.get('content'));
    },

    pinchStart: function(recognizer) {

    },

    pinchChange: function(recognizer) {
        var newScale = recognizer.get('scale');
        var curScale = this.$().css('scale');

        this.$().css('z-index', 100);

        this.$().css('scale', function(index, value) {

            return newScale * value;
        });
    },

    pinchEnd: function(recognizer) {
        this.$().css('z-index', 1);
    },

    pinchCancel: function(recognizer) {
        this.$().css('z-index', 1);
    },

    panOptions: {
        numberOfRequiredTouches: 1
    },

    panChange: function(recognizer) {
        var val = recognizer.get('translation');
        $("#output").html('panChange x: ' + val.x + ' y: ' + val.y + '  %@=%@'.fmt((val.x < 0) ? '-' : '+', Math.abs(val.x)));
        this.$().css({
            zIndex: 10,
            x: '%@=%@'.fmt((val.x < 0) ? '-' : '+', Math.abs(val.x)),
            y: '%@=%@'.fmt((val.y < 0) ? '-' : '+', Math.abs(val.y))
        });
    }
});