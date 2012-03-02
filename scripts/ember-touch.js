
(function(exports) {
// ==========================================================================
// Project:  Ember Touch
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Em.get;
var set = Em.set;

/**
  @class

  Registry of known gestures in the system. This is a singleton class, and is
  used by Em.View to analyze instances of Em.View for gesture support.

  You will not use this class yourself. Rather, gesture recognizers will call
  Em.Gestures.register(name, recognizer) when they want to make the system aware
  of them.

  @private
  @extends Em.Object
*/
Em.Gestures = Em.Object.create(
/** @scope Em.Gestures.prototype */{

  _registeredGestures: null,

  init: function() {
    this._registeredGestures = {};

    return this._super();
  },

  /**
    Registers a gesture recognizer to the system. The gesture recognizer is
    identified by the name parameter, which must be globally unique.
  */
  register: function(name, /** Em.Gesture */recognizer) {
    var registeredGestures = this._registeredGestures;

    if (registeredGestures[name] !== undefined) {
      throw new Em.Error(name+" already exists as a registered gesture recognizers. Gesture recognizers must have globally unique names.");
    }

    registeredGestures[name] = recognizer;
  },

  unregister: function(name) {
    var registeredGestures = this._registeredGestures;

    if (registeredGestures[name] !== undefined) {
      registeredGestures[name] = undefined;
    }
  },

  /**
    Registers a gesture recognizer to the system. The gesture recognizer is
    identified by the name parameter, which must be unique across the system.
  */
  knownGestures: function() {
    var registeredGestures = this._registeredGestures;

    return (registeredGestures)? registeredGestures : {};
  }

});


})({});


(function(exports) {

/**
  @class

  Manage the states of no-simulataneosly views. 

  TODO: 
    - the initialization/destroy process must be improved.
    suggested based on Application cycle. 

  @extends Em.Object
*/
Em.AppGestureManager = Em.Object.create({

  _isBlocked: false,


  /*
  Assign the view which has blocked the recognizer, in order
  that view can be the only one which can unblock the recognizer. 
  */
  _blockerView: null,


  isBlocked: Em.computed(function(){

    return this.get('_isBlocked');

  }).property('_isBlocked'),

  wasBlockedBy: function ( view ) {

    return view === this.get('_blockerView');

  },


  block: function( view ) {

    if ( this.get('isBlocked') ) {
      throw Error('manager has already blocked the gesture recognizer');
    }


    if (  view.get('simultaneosly') ) {
      // ember_assert
      throw Error('a view with simultaneosly property true, cannot block the gesture recognizer');
    }

    this.set('_isBlocked', true);
    this.set('_blockerView', view);

  },

  unblock: function( view ) {

    if ( !this.get('isBlocked') ) {
      throw Error('unblock, the gesture recognizer when the recognizer was not blocked. Did you unblock after Start? ');
    }

    if (  view.get('simultaneosly') ) { // ember_assert
      throw Error('a view with simultaneosly property true, cannot unblock the gesture recognizer');
    }

    var blockerView = this.get('_blockerView');

    if ( view !== blockerView ) {
      throw Error('unblock a view which was not the one which blocked the gesture recognizer');
    }
    this.set('_isBlocked', false);

  },

  restart: function() {

    this.set('_isBlocked', false);
    this.set('_blockerView', null);

  }

});

})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch 
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


var get = Em.get;
var set = Em.set;

/**
  @class

  Manages multiplegesture recognizers that are associated with a view.
  This class is instantiated automatically by Em.View and you wouldn't
  interact with it yourself.

  Em.GestureManager mainly acts as a composite for the multiple gesture
  recognizers associated with a view. Whenever it gets a touch event, it
  relays it to the gestures. The other main resposibility of
  Em.GestureManager is to handle re-dispatching of events to the view.

  @extends Em.Object
*/
Em.GestureManager = Em.Object.extend({

  /**
    An array containing all the gesture recognizers associated with a
    view. This is set automatically by Em.View.

    @default null
    @type Array
  */
  gestures: null,
  view: null,

  /**
    Relays touchStart events to all the gesture recognizers to the
    specified view

    @return Boolen
  */
  touchStart: function(evt, view) {
    return this._invokeEvent('touchStart',evt);
  },

  /**
    Relays touchMove events to all the gesture recognizers to the
    specified view

    @return Boolen
  */
  touchMove: function(evt, view) {
    return this._invokeEvent('touchMove',evt);
  },

  /**
    Relays touchEnd events to all the gesture recognizers to the
    specified view

    @return Boolen
  */
  touchEnd: function(evt, view) {
    return this._invokeEvent('touchEnd',evt);
  },

  /**
    Relays touchCancel events to all the gesture recognizers to the
    specified view

    @return Boolen
  */
  touchCancel: function(evt, view) {
    return this._invokeEvent('touchCancel',evt);
  },

  /**
    Relays an event to the gesture recognizers. Used internally
    by the touch event listeners. Propagates the event to the parentViews.

    @private
    @return Boolean
  */
  _invokeEvent: function(eventName, eventObject) {

    var gestures = this.get('gestures')
        , gesture
        , handler
        , result = true;


    for (var i=0, l=gestures.length; i < l; i++) {
      gesture = gestures[i];
      handler = gesture[eventName];

      if (Em.typeOf(handler) === 'function') {

        var gestureDelegate = gesture.get('delegate');
        if ( !gestureDelegate || gestureDelegate.shouldReceiveTouch( gesture, this.view, eventObject )  ) {
          result = handler.call(gesture, eventObject);
        } 


      }
   };
    
    // browser delivers the event to the DOM element
    // bubble the event to the parentView
    var parentView = this.view.get('parentView');
    if ( parentView ) {
      var manager = parentView.get('eventManager');
      if ( manager ) { manager._invokeEvent(eventName, eventObject); }
      
    }

    return result;

  }

});

})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Em.get;
var set = Em.set;

/**
  @class
  @private

  Used to manage and maintain a list of active touches related to a gesture 
  recognizer.
*/
Em.TouchList = Em.Object.extend({
  touches: null,

  timestamp: null,

  init: function() {
    this._super();

    set(this, 'touches', []);
  },

  addTouch: function(touch) {
    var touches = get(this, 'touches');
    touches.push(touch);
    this.notifyPropertyChange('touches');
  },

  updateTouch: function(touch) {
    var touches = get(this, 'touches');

    for (var i=0, l=touches.length; i<l; i++) {
      var _t = touches[i];

      if (_t.identifier === touch.identifier) {
        touches[i] = touch;
        this.notifyPropertyChange('touches');
        break;
      }
    }
  },

  removeTouch: function(touch) {
    var touches = get(this, 'touches');

    for (var i=0, l=touches.length; i<l; i++) {
      var _t = touches[i];

      if (_t.identifier === touch.identifier) {
        touches.splice(i,1);
        this.notifyPropertyChange('touches');
        break;
      }
    }
  },

  removeAllTouches: function() {
    set(this, 'touches', []);
  },

  touchWithId: function(id) {
    var ret = null,
        touches = get(this, 'touches');

    for (var i=0, l=touches.length; i<l; i++) {
      var _t = touches[i];

      if (_t.identifier === id) {
        ret = _t;
        break;
      }
    }

    return ret;
  },

  length: Ember.computed(function() {
    var touches = get(this, 'touches');
    return touches.length;
  }).property('touches').cacheable()

});

})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch 
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



var get = Em.get;
var set = Em.set;

var sigFigs = 100;

/**
  @class

  Base class for all gesture recognizers. Handles low-level touch and state
  management, and provides some utility methods and some required methods all
  gesture recognizers are expected to implement.

  ## Overview

  Gestures coalesce multiple touch events to a single higher-level gesture
  event. For example, a tap gesture recognizer takes information about a
  touchstart event, a few touchmove events, and a touchend event and uses
  some heuristics to decide whether or not that sequence of events qualifies
  as a tap event. If it does, then it will notify the view of the higher-level
  tap events.

  Gesture events follow the format:

    * *[GESTURE_NAME]* Start - Sent when a gesture has gathered enough information
        to begin tracking the gesture

    * *[GESTURE_NAME]* Change - Sent when a gesture has already started and has
        received touchmove events that cause its state to change

    * *[GESTURE_NAME]* End - Sent when a touchend event is received and the gesture
        recognizer decides that the gesture is finished.

    * *[GESTURE_NAME]* Cancel - Sent when a touchcancel event is received.

  There are two types of gestures: Discrete and Continuous gestures. In contrast
  to continuous gestures, discrete gestures don't have any change events. Rather,
  the end event is the only one that gets sent to the view.

  ## Usage

  While you wouldn't use Em.Gesture directly, all its subclasses implement the 
  same API. For example, to implement pinch on a view, you implement one or more 
  of the pinch events. For example:

      var myView = Em.View.create({
        pinchStart: function(recognizer) {
          this.$().css('background','red');
        },

        pinchChange: function(recognizer) {
          var scale = recognizer.get('scale');
          this.$().css('scale',function(index, value) {
            return recognizer.get('scale') * value
          });
        },

        pinchEnd: function(recognizer) {
          this.$().css('background','blue');
        },

        pinchCancel: function(recognizer) {
          this.$().css('background','blue');
        }
      });

  pinchStart(), pinchEnd() and pinchCancel() will only get called once per
  gesture, but pinchChange() will get called repeatedly called every time
  one of the touches moves.

  ## Customizing Gesture Recognizers

  Some of the gesture recognizers include properties that can be customized by 
  the user for a specific instance of a view. For example, a pan gesture defaults 
  to being a one-finger gesture, but in some scenarios, it must be defined as a 
  two-finger gesture. In that case, you can override defaults by specifying an 
  Options hash. 

      var myView = Em.View.create({
        panOptions: {
          numberOfRequiredTouches: 2
        }
      });      

  ## Creating Custom Gesture Recognizers

  Em.Gesture also defines an API which its subclasses can implement to build
  custom gestures. The methods are:

    * **didBecomePossible** - Called when a gesture enters a possible state. This
        means the gesture recognizer has accepted enough touches to match 
        the number of required touches. You would usually initialize your state
        in this callback.

    * **eventWasRejected** - Called if a view returns false from a gesture event.
        This callback allows you to reset internal state if the user rejects
        an event.

    * **shouldBegin** - Allows a gesture to block itself from entering a began state.
        This callback will continuously be called as touches move until it begins.

    * **shouldEnd** - Allows a gesture to block itself from entering an ended state.
        This callback gets called whenever a tracked touch gets a touchEnd event.

    * **didBegin** - Called when the gesture enters a began state. Called before the
       view receives the Start event on continuous gestures.

    * **didChange** - Called when the gesture enters a changed state, and when one of the
        touches moves. Called before the view receives the Change event on continuos gestures.

    * **didEnd** - Called when the gesture enters an ended state. Called before the
       view receives the End event.

    * **didCancel** - Called when the gesture enters a cancelled state. Called before the
       view receives the Cancel event on continuos gestures.

  In all the callbacks, you can use the `touches` protected property to access the
  touches hash. The touches hash is keyed on the identifiers of the touches, and the
  values are the jQuery.Event objects. You can also access the length property to inspect 
  how many touches are active, this is mostly useful in shouldBegin since every other 
  callback can assume that there are as many active touches as specified in the 
  numberOfRequiredTouches property.

  ## Discrete vs Continuous Gestures

  There are two main classes of gesture recognizers: Discrete and Continuous 
  gestures. Discrete gestures do not get Start, Change nor Cancel events sent, 
  since they represent a single, instantaneous event, rather than a continuous 
  motion. If you are implementing your own discrete gesture recognizer, you must 
  set the gestureIsDiscrete property to yes, and Em.Gesture will adapt its behavior.

  Discrete gestures use the shouldEnd callback to either accept or decline the gesture
  event. If it is declined, then the gesture will enter a Cancelled state.
  
  @extends Em.Object
*/



Em.Gesture = Em.Object.extend(
  /** @scope Em.Gesture.prototype */{

  /**
    The current state of the gesture recognizer. This value can be any one
    of the states defined at the end of this file.

    @type Number
  */
  state: null,

  /**
    A string of the gesture recognizer's name. This value is set automatically
    but Em.Gestures when a gesture is registered.

    @type String
  */
  name: null,

  /** 
    View in which the gesture must be recognized.
    Assigned on startup.
  */
  view: null,
  
  /** 
    Specifies whether a gesture is discrete or continuous.

    @type Boolean
    @default false
  */
  gestureIsDiscrete: false,


  preventDefaultOnChange: false,


  /**
    When true is guaranteed to allow simultaneous recognition. When false, the gesture  
    should not be recognized when there is other active gesture whose simultaneously is disabled.

    @type Boolean
    @default true
  */
  simultaneously: true,

  appGestureManager:null,

  /** 
    You can use the `touches` protected property to access the touches hash. The touches 
    hash is keyed on the identifiers of the touches, and the values are the jQuery.Event 
    objects.

    @private 
    @type Hash
  */
  touches: null,

  /** 
    You can also use the numberOfActiveTouches property to inspect how many touches
    are active, this is mostly useful in shouldBegin since every other callback can
    assume that there are as many active touches as specified in the 
    numberOfRequiredTouches property.

    @private 
    @type Number
  */
  numberOfActiveTouches: 0,

  /** 
    Used to specify the number of touches required for the gesture to enter a possible 
    state

    @private 
    @type Number
  */
  numberOfRequiredTouches: 1,

	/**
   Assign a gesture delegate based on the delegate name.
  */
  delegateName: null,
 
  /*	
	Apply a delegate to customize an application's gesture-recognition behavior. 
  */
  delegate: null, 


  init: function() {
    this._super();
    this.touches = Em.TouchList.create();

    var delegateName =  this.get('delegateName');
    var delegate =  this.get('delegate');

    if (!delegate && delegateName ) {
      var delegate = Em.GestureDelegates.find(delegateName);
      ember_assert('empty delegate, attempting to set up delegate based on delegateName', delegate);
      this.set('delegate', delegate);
    }

  },

  //..............................................
  // Gesture Callbacks

  /** @private */
  didBecomePossible: function() { },



  /** @private */
  shouldBegin: function() {
    return true;
  },

  /** @private */
  didBegin: function() { },

  /** @private */
  didChange: function() { },

  /** @private */
  eventWasRejected: function() { },

  /** @private */
  shouldEnd: function() {
    return true;
  },

  /** @private */
  didEnd: function() { },

  /** @private */
  didCancel: function() { },

  //..............................................
  // Utilities

  /** @private */


  simultaneouslyAllowed: function() {

    var result = true;

    if ( !this.simultaneously ) {

      if ( !this.manager.appGestureManager.get('isBlocked') ) {

        this.manager.appGestureManager.block(this.view); 

      } else {

        // normally, when blocked it must return false. 
        // But it could find the case, in which, the gesture did not unblock 
        // ( cause of missing events/ or code developer ). 
        // on this case, i want the same view can recognize again the gesture
        
        result = this.manager.appGestureManager.wasBlockedBy(this.view); 
      }

    }
    return result;
  },
  
  /**
    Notify the View of the event and trigger eventWasRejected if the view don't implement the API 
    or return false

  */
  attemptGestureEventDelivery: function(eventName) {

    var wasNotified =  this.notifyViewOfGestureEvent(eventName);
    if ( !wasNotified ) {
      this.eventWasRejected();
    }             

  },

  /**
    Given two Touch objects, this method returns the distance between them.

    @return Number
  */
  distance: function(touches) {

    if (touches.length < 2) {
      return 0;
    }

    var first = touches[0];
    var second = touches[1];

    var x = first.pageX;
    var y = first.pageY;
    var x0 = second.pageX;
    var y0 = second.pageY;

    return Math.sqrt((x -= x0) * x + (y -= y0) * y);
  },

  /**
    Given two Touch objects, this method returns the midpoint between them.

    @return Number
  */
  centerPointForTouches: function(touches) {
    var sumX = 0,
        sumY = 0;

    for (var i=0, l=touches.length; i<l; i++) {
      var touch = touches[i];
      sumX += touch.pageX;
      sumY += touch.pageY;
    }

    var location = {
      x: sumX / touches.length,
      y: sumY / touches.length
    };

    return location;
  },

  /** @private */
  _objectValues: function(object) {
    var ret = [];

    for (var item in object ) {
      if (object.hasOwnProperty(item)) {
        ret.push(object[item]);
      }
    }

    return ret;
  },

  /**
    Allows the gesture to notify the view it's associated with of a gesture
    event.

    @private
  */
  notifyViewOfGestureEvent: function(eventName, data) {
    var handler = this.view[eventName];
    var result = false;

    if (Em.typeOf(handler) === 'function') {
      result = handler.call(this.view, this, data);
    }

    return result;
  },

  toString: function() {
    return Em.Gesture+'<'+Em.guidFor(this)+'>';
  },

  /** @private */
  _resetState: function() {
    this.touches.removeAllTouches();
  },

  //..............................................
  // Touch event handlers

  /** @private */
  touchStart: function(evt) {
    var targetTouches = evt.originalEvent.targetTouches;
    var _touches = this.touches;
    var state = get(this, 'state');

    set(_touches, 'timestamp', Date.now());

    //Collect touches by their identifiers
    for (var i=0, l=targetTouches.length; i<l; i++) {
      var touch = targetTouches[i];

      if(_touches.touchWithId(touch.identifier) === null  ) {

        if ( _touches.get('length') === get(this, 'numberOfRequiredTouches')  ) {
          // restart touches, otherwise a gesture could state on possible state forever 
          _touches.removeAllTouches();
        }
        _touches.addTouch(touch);
      }
    }

    if (_touches.get('length') < get(this, 'numberOfRequiredTouches')) {
      set(this ,'state', Em.Gesture.WAITING_FOR_TOUCHES);

    } else {
      if ( this.gestureIsDiscrete ) {

      // Discrete gestures may skip the possible step if they're ready to begin
        //
        if (this.shouldBegin() && this.simultaneouslyAllowed()  ) {
          set(this, 'state', Em.Gesture.BEGAN);
          this.didBegin();
        }

      } else {
        set(this, 'state', Em.Gesture.POSSIBLE);
        this.didBecomePossible();
      }
    }

  },

  /** @private */
  touchMove: function(evt) {
    var state = get(this, 'state');

    if (state === Em.Gesture.WAITING_FOR_TOUCHES || state === Em.Gesture.ENDED || state === Em.Gesture.CANCELLED) {

      // Nothing to do here
      return;
    }

    var changedTouches = evt.originalEvent.changedTouches;
    var _touches = this.touches;

    set(_touches, 'timestamp', Date.now());

    // Update touches hash
    for (var i=0, l=changedTouches.length; i<l; i++) {
      var touch = changedTouches[i];
      _touches.updateTouch(touch);
    }

    if (state === Em.Gesture.POSSIBLE && !this.gestureIsDiscrete) {

      if (this.shouldBegin() && this.simultaneouslyAllowed()  ) {

        set(this, 'state', Em.Gesture.BEGAN);
        this.didBegin();

        // Give the gesture a chance to update its state so the view can get 
        // updated information in the Start event 
        this.didChange();

        if ( this.preventDefaultOnChange ) {
          evt.preventDefault();
        }

        this.attemptGestureEventDelivery(get(this, 'name')+'Start');
      }

    } else if (state === Em.Gesture.BEGAN || state === Em.Gesture.CHANGED)  {

      set(this, 'state', Em.Gesture.CHANGED);
      this.didChange();

      if ( this.preventDefaultOnChange ) {
        evt.preventDefault();
      }

      // Discrete gestures don't fire changed events
      if ( !this.gestureIsDiscrete ) {

        this.attemptGestureEventDelivery( get(this, 'name')+'Change');

      }

    }


  },

  /** @private */
  touchEnd: function(evt) {
    var state = get(this, 'state');
    var _touches = this.touches;
    set(_touches, 'timestamp', Date.now());


    var changedTouches = (evt && evt.originalEvent ) ? evt.originalEvent.changedTouches : undefined;
    if ( changedTouches ) {
      // Update touches hash
      for (var i=0, l=changedTouches.length; i<l; i++) {
        var touch = changedTouches[i];
        _touches.updateTouch(touch);
      }
    }

    if ( this.gestureIsDiscrete ) {

      if ( state === Em.Gesture.BEGAN || state === Em.Gesture.CHANGED ) {


        // Discrete gestures use shouldEnd to either accept or decline the gesture.
        if ( this.shouldEnd() ) {

          set(this, 'state', Em.Gesture.ENDED);
          this.didEnd();
          this.attemptGestureEventDelivery( get(this, 'name')+'End');

        }  

      }

    }  else {

      if ( state === Em.Gesture.BEGAN || state === Em.Gesture.CHANGED ) {

        if ( this.shouldEnd() ) {


          set(this, 'state', Em.Gesture.ENDED);
          this.didEnd();

          this.attemptGestureEventDelivery( get(this, 'name')+'End');

        }

      }

    }

    this._resetState();
  },

  /** @private */
  touchCancel: function(evt) {
    var state = get(this, 'state');

    if ( state !== Em.Gesture.CANCELLED) {

      set(this, 'state', Em.Gesture.CANCELLED);
      this.didCancel();

      if ( !this.gestureIsDiscrete ) {
        this.notifyViewOfGestureEvent( get(this, 'name')+'Cancel');
      }

    } 

    this._resetState();

  },

  /*  debug Utils */
  /*
  _stateChanged: Em.observer(function(){
    var state = get(this, 'state');
    console.log( this.toString() + ' ' + this._stateToString( state ) ); 
  }, 'state'),
  */
  _stateToString: function(state) {

    var result = 'NONE';
    switch (state ) {
        case Em.Gesture.WAITING_FOR_TOUCHES:
            result = 'WAITING_FOR_TOUCHES';
            break;
        case Em.Gesture.POSSIBLE:
            result = 'POSSIBLE';
            break;
        case Em.Gesture.BEGAN:
            result = 'BEGAN';
            break;
        case Em.Gesture.CHANGED:
            result = 'CHANGED';
            break;
        case Em.Gesture.ENDED:
            result = 'ENDED';
            break;
        case Em.Gesture.CANCELLED:
            result = 'CANCELLED';
            break;
    }

    return result;

  }


});

Em.GestureDirection = {
  Vertical: 1,
  Horizontal: 2
}


Em.OneGestureDirection = {
  Right: 1,
  Left: 2, 
  Down: 4,
  Up: 8
}

Em.Gesture.WAITING_FOR_TOUCHES = 0;
Em.Gesture.POSSIBLE = 1; // only continuous
Em.Gesture.BEGAN = 2;
Em.Gesture.CHANGED = 3; 
Em.Gesture.ENDED = 4;
Em.Gesture.CANCELLED = 5;

//TODO: 
//- think about multiple events handling at the same time currentEventObject
//- check meaning of manager.redispatEventToView
//- emberjs.event_manager. dispatchEvent should pass the view? I think is not necesary cause of the view has its own manager, 
//  so manager should have assigned its view.
//  testing directions on pan and swipe gestures
//  LifeCycle of Em.AppGestureManager

})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch 
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Em.get;
var set = Em.set;

var sigFigs = 100;

/**
  @class

  Recognizes a multi-touch pinch gesture. Pinch gestures require a specified number
  of fingers to move and will record and update the scale.

  For pinchChange events, the pinch gesture recognizer includes a scale property
  which can be applied as a CSS transform directly.

    var myview = Em.View.create({
      elementId: 'gestureTest',
      
      pinchChange: function(rec) {
        this.$().css('scale',function(index, value) {
          return rec.get('scale') * value
        });
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the pinchOptions hash:

    var myview = Em.View.create({
      pinchOptions: {
        numberOfRequiredTouches: 3
      }
      ...
    })


  @extends Em.Gesture
*/
Em.PinchGestureRecognizer = Em.Gesture.extend({

  /**
    The scale value which represents the current amount of scaling that has been applied
    to the view. You would normally apply this value directly to your element as a 3D
    scale.

    @type Number
  */
  scale: 1,

  numberOfRequiredTouches: 2,

  //..................................................
  // Private Methods and Properties

  /**
    Track starting distance between touches per gesture.

    @private
    @type Number
  */
  _startingDistanceBetweenTouches: null,

  /**
    Used for measuring velocity

    @private
    @type Number
  */
  _previousTimestamp: null,

  /**
    Used for measuring velocity and scale

    @private
    @type Number
  */  
  _previousDistance: 0,

  /**
    The pixel distance that the fingers need to get closer/farther away by before
    this gesture is recognized.

    @private
    @type Number
  */
  _deltaThreshold: 5,

  /**
    Used for rejected events

    @private
    @type Number
  */
  _previousScale: 1,

  /**
    @private
  */
  didBecomePossible: function() {
    this._startingDistanceBetweenTouches = this.distance(get(this.touches,'touches'));
    this._previousDistance = this._startingDistanceBetweenTouches;
    this._previousTimestamp = get(this.touches,'timestamp');
  },

  shouldBegin: function() {
    var currentDistanceBetweenTouches = this.distance(get(this.touches,'touches'));

    return Math.abs(currentDistanceBetweenTouches - this._startingDistanceBetweenTouches) >= this._deltaThreshold;
  },

  didChange: function() {
    var scale = this._previousScale = get(this, 'scale');
    var timeDifference = this.touches.timestamp - this._previousTimestamp;
    var currentDistanceBetweenTouches = this.distance(get(this.touches,'touches'));
    var distanceDifference = (currentDistanceBetweenTouches - this._previousDistance);

    set(this, 'velocity', distanceDifference / timeDifference);
    set(this, 'scale', currentDistanceBetweenTouches / this._previousDistance);
    
    this._previousTimestamp = get(this.touches,'timestamp');
    this._previousDistance = currentDistanceBetweenTouches;
  },

  eventWasRejected: function() {
    set(this, 'scale', this._previousScale);
  }

});

Em.Gestures.register('pinch', Em.PinchGestureRecognizer);

})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch 
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Em.get;
var set = Em.set;
var x = 0;

/**
  @class

  Recognizes a multi-touch pan gesture. Pan gestures require a specified number
  of fingers to move and will record and update the center point between the
  touches.

  For panChange events, the pan gesture recognizer includes a translation property
  which can be applied as a CSS transform directly. Translation values are hashes
  which contain an x and a y value.

    var myview = Em.View.create({
      elementId: 'gestureTest',
      
      panChange: function(rec) {
        var val = rec.get('translation');
        this.$().css({
          translateX: '%@=%@'.fmt((val.x < 0)? '-' : '+',Math.abs(val.x)),
          translateY: '%@=%@'.fmt((val.y < 0)? '-' : '+',Math.abs(val.y))
        });
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the panOptions hash:

    var myview = Em.View.create({
      panOptions: {
        numberOfRequiredTouches: 3
      }
      ...
    })

  @extends Em.Gesture
*/
Em.PanGestureRecognizer = Em.Gesture.extend({

  /**
    The translation value which represents the current amount of movement that has been applied
    to the view. You would normally apply this value directly to your element as a 3D
    transform.

    @type Location
  */
  translation: null,


  /**
    The pixel distance that the fingers need to move before this gesture is recognized.
    You should set up depending on your device factor and view behaviors.
    Distance is calculated separately on vertical and horizontal directions depending 
    on the direction property.

    @private
    @type Number
  */
  initThreshold: 5,

  direction:  Em.GestureDirection.Horizontal | Em.GestureDirection.Vertical , 

  //..................................................
  // Private Methods and Properties

  /**
    Used to measure offsets

    @private
    @type Number
  */
  _previousLocation: null,

  /**
    Used for rejected events

    @private
    @type Hash
  */
  _previousTranslation: null,


  init: function() {
    this._super();
    set(this, 'translation', {x:0,y:0});
  },

  didBecomePossible: function() {

    this._previousLocation = this.centerPointForTouches(get(this.touches,'touches'));
  },

  shouldBegin: function() {
    var previousLocation = this._previousLocation;
    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var x = previousLocation.x;
    var y = previousLocation.y;
    var x0 = currentLocation.x;
    var y0 = currentLocation.y;

    var shouldBegin = false;
    //shouldBegin = Math.sqrt( (x - x0)*(x - x0) + (y - y0)*(y - y0)   ) >= this.initThreshold;
    
    if ( this.direction & Em.GestureDirection.Vertical ) {

      shouldBegin = Math.abs( y - y0 ) >= this.initThreshold;

    } 
    if (!shouldBegin && ( this.direction & Em.GestureDirection.Horizontal ) ) {

      shouldBegin = Math.abs( x - x0 ) >= this.initThreshold;

    }

    return shouldBegin;

  },

  didChange: function() {
    var previousLocation = this._previousLocation;
    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));
    var translation = {x:currentLocation.x, y:currentLocation.y};

    translation.x = currentLocation.x - previousLocation.x;
    translation.y = currentLocation.y - previousLocation.y;

    this._previousTranslation = get(this, 'translation');
    set(this, 'translation', translation);
    this._previousLocation = currentLocation;
  },

  eventWasRejected: function() {
    set(this, 'translation', this._previousTranslation);
  },

  toString: function() {
    return Em.PanGestureRecognizer+'<'+Em.guidFor(this)+'>';
  }

});

Em.Gestures.register('pan', Em.PanGestureRecognizer);

})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch 
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Em.get;
var set = Em.set;

/**
  @class

  Recognizes a multi-touch tap gesture. Tap gestures allow for a certain amount
  of wiggle-room between a start and end of a touch. Taps are discrete gestures
  so only tapEnd() will get fired on a view.

    var myview = Em.View.create({
      elementId: 'gestureTest',

      tapEnd: function(recognizer) {
        $('#gestureTest').css('background','yellow');
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the panOptions hash:

    var myview = Em.View.create({
      tapOptions: {
        numberOfRequiredTouches: 3
      }
      ...
    })

  And you can also specify the number of taps required for the gesture to fire using the numberOfTaps
  property.


    var myview = Em.View.create({
      tapOptions: {
        numberOfTaps: 3,
        delayBetweenTaps: 150
      }
      ...
    })

  @extends Em.Gesture
*/
Em.TapGestureRecognizer = Em.Gesture.extend({

  /**
    The translation value which represents the current amount of movement that has been applied
    to the view. You would normally apply this value directly to your element as a 3D
    transform.

    @type Location
  */
  numberOfTaps: 1,

  delayBetweenTaps: 500,

  tapThreshold: 10,

  //..................................................
  // Private Methods and Properties

  /** @private */
  gestureIsDiscrete: true,

  /** @private */
  _initialLocation: null,

  /** @private */
  _waitingTimeout: null,

  /** @private */
  _waitingForMoreTouches: false,

  _internalTouches: null,

  init: function(){
    this._super();
    this._internalTouches = Em.TouchList.create(); 
    ember_assert( get(this, 'numberOfRequiredTouches')===1, 'TODO: still not prepared for higher number' );
  },

  shouldBegin: function() {

    return get(this.touches,'length') === get(this, 'numberOfRequiredTouches');

  },

  didBegin: function() {

    this._initialLocation = this.centerPointForTouches(get(this.touches,'touches'));
    this._internalTouches.addTouch( this.touches[0] );

    this._waitingForMoreTouches = get(this._internalTouches,'length') < get(this, 'numberOfTaps');

    if ( this._waitingForMoreTouches ) {

      var that = this;
      this._waitingTimeout = window.setTimeout( function() {
        that._waitingFired(that);
      }, this.delayBetweenTaps);

    } 

  },

  shouldEnd: function() {

    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var x = this._initialLocation.x;
    var y = this._initialLocation.y;
    var x0 = currentLocation.x;
    var y0 = currentLocation.y;

    var distance = Math.sqrt((x -= x0) * x + (y -= y0) * y);

    return (Math.abs(distance) < this.tapThreshold) && !this._waitingForMoreTouches;
    
  },



  didEnd: function() {

    window.clearTimeout( this._waitingTimeout );


    // clean internalState
    this._initialLocation = null;
    this._internalTouches.removeAllTouches();

  },

  _waitingFired: function() {

    // clean internalState
    this._initialLocation = null;
    this._internalTouches.removeAllTouches();

    // set state for the gesture manager
    set(this, 'state', Em.Gesture.CANCELLED);
    var eventName = get(this, 'name')+'Cancel';
    this.attemptGestureEventDelivery(eventName);
    this._resetState(); 

  },


  toString: function() {
    return Em.TapGestureRecognizer+'<'+Em.guidFor(this)+'>';
  }

});

Em.Gestures.register('tap', Em.TapGestureRecognizer);


})({});


(function(exports) {

var get = Em.get;
var set = Em.set;

/**
  @class

  Recognizes a multi-touch press gesture. Press gestures 
  allow for a certain amount of wiggle-room between a start and end of a touch,
  and requires a minimum hold period to be triggered. 

  Presss are discrete gestures so only tapEnd() will get fired on a view.

    var myview = Em.View.create({
      elementId: 'gestureTest',
      
      pressEnd: function(recognizer) {

      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, and a minimum pressPeriodThreshold which you can set in the pressHoldOptions hash:

    var myview = Em.View.create({
      pressOptions: {
        pressPeriodThreshold: 500
      }
      ...
    })


  @extends Em.Gesture
*/
Em.PressGestureRecognizer = Em.Gesture.extend({

  /**
    The minimum period (ms) that the fingers must be held to recognize the gesture end.

    @private
    @type Number
  */
  pressPeriodThreshold: 500,
  //..................................................
  // Private Methods and Properties

  /** @private */
  gestureIsDiscrete: true,

  /** @private */
  _initialLocation: null,

  /** @private */
  _moveThreshold: 10,

  /** @private */
  _initialTimestamp: null,


  shouldBegin: function() {
    return get(this.touches,'length') === get(this, 'numberOfRequiredTouches');
  },

  didBegin: function() {
    this._initialLocation = this.centerPointForTouches(get(this.touches,'touches'));
    this._initialTimestamp = get(this.touches,'timestamp');
  },

  shouldEnd: function() {

    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var x = this._initialLocation.x;
    var y = this._initialLocation.y;
    var x0 = currentLocation.x;
    var y0 = currentLocation.y;

    var distance = Math.sqrt((x -= x0) * x + (y -= y0) * y);

    var isValidDistance = (Math.abs(distance) < this._moveThreshold);


    var nowTimestamp = get(this.touches,'timestamp');
    var isValidHoldPeriod = (nowTimestamp - this._initialTimestamp ) >= this.pressPeriodThreshold;

    var result = isValidDistance && isValidHoldPeriod;

    if  ( !result ) {
      set(this, 'state', Em.Gesture.CANCELLED);
      this.didCancel();
    }

    return result;
  },

  didEnd: function() {

    this._resetCounters();

  },

  didCancel: function() {

    this._resetCounters();

  },

  _resetCounters: function() {

    this._initialLocation = null;
    this._initialTimestamp = null;

  },

  toString: function() {
    return Em.PressGestureRecognizer+'<'+Em.guidFor(this)+'>';
  }

});

Em.Gestures.register('press', Em.PressGestureRecognizer);


})({});


(function(exports) {

var get = Em.get;
var set = Em.set;

/**
  @class

  Recognizes a multi-touch touch and hold gesture. Touch and Hold gestures 
  allow move the finger on the same view, and after the user leaves its finger 
  motionless during a specific period the end view event is automatically triggered. 

  TouchHold are discrete gestures so only touchHoldEnd() will get fired on a view.

    var myview = Em.View.create({
      elementId: 'gestureTest',
      
      touchHoldEnd: function(recognizer) {

      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, a minimum "period" the finger must be held to automatically trigger the end event 
  and "moveThreshold" which allows to move the finger a specific number of pixels

    var myview = Em.View.create({
      touchHoldOptions: {
        holdPeriod: 500,
        moveThreshold: 10
      }
      ...
    })


  @extends Em.Gesture
*/
Em.TouchHoldGestureRecognizer = Em.Gesture.extend({

  /**
    The minimum period (ms) that the fingers must be held to trigger the event.

    @private
    @type Number
  */
  holdPeriod: 2000,

  moveThreshold: 50,

  //..................................................
  // Private Methods and Properties

  /** @private */
  gestureIsDiscrete: true,

  _endTimeout: null,

  _targetElement: null,


  shouldBegin: function() {
    return get(this.touches,'length') === get(this, 'numberOfRequiredTouches');
  },

  didBegin: function() {

    this._initialLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var target = get(this.touches,'touches')[0].target;
    set(this,'_target', target ); 

    var that = this;
    this._endTimeout = window.setTimeout( function() {

      that._endFired(that);

    }, this.holdPeriod);

  },

  didChange: function() {

    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var x = this._initialLocation.x;
    var y = this._initialLocation.y;
    var x0 = currentLocation.x;
    var y0 = currentLocation.y;

    var distance = Math.sqrt((x -= x0) * x + (y -= y0) * y);

    var isValidMovement = (Math.abs(distance) < this.moveThreshold);
    // ideal situation would be using touchleave event to be notified
    // the touch leaves the DOM element
    if ( !isValidMovement ) {
      this._disableEndFired();
      set(this, 'state', Em.Gesture.CANCELLED);

      //this._resetState(); // let be executed on touchEnd
    }

  },

  // when a touchend event was fired ( cause of removed finger )
  // disable interval action trigger and block end state
  // this event is responsable for gesture cancel
  shouldEnd: function() {
    
    this._disableEndFired();
    set(this, 'state', Em.Gesture.CANCELLED);
    this.didCancel();

    return  false;

  },

  _endFired: function() {

    this._disableEndFired();
    
    if ( this.state === Em.Gesture.BEGAN || this.state === Em.Gesture.CHANGED ) {

      set(this, 'state', Em.Gesture.ENDED)

      var eventName = get(this, 'name')+'End';

      this.attemptGestureEventDelivery(eventName);

      //this._resetState(); // let be executed on touchEnd
      
    }

  },

  _disableEndFired: function() {

     window.clearTimeout(this._endTimeout);

  },

  toString: function() {
    return Em.TouchHoldGestureRecognizer+'<'+Em.guidFor(this)+'>';
  }

});

Em.Gestures.register('touchHold', Em.TouchHoldGestureRecognizer);


})({});


(function(exports) {

var get = Em.get; var set = Em.set;

/**
  @class

  Recognizes a swipe gesture in one or more directions.

  Swipes are continuous gestures that will get fired on a view.

    var myview = Em.View.create({

      swipeStart: function(recognizer) {

      },
      swipeChange: function(recognizer) {

      },
      // usually, you will only use this method
      swipeEnd: function(recognizer) {

      },
      swipeCancel: function(recognizer) {

      }
    })

  SwipeGestureRecognizer recognizes a swipe when the touch has moved to a (direction) 
  far enough (swipeThreshold) in a period (cancelPeriod). 
  The current implementation will only recognize a direction on swipeEnd on (recognizer.swipeDirection).

    var myview = Em.View.create({
      swipeOptions: {
        direction: Em.OneGestureDirection.Left | Em.OneGestureDirection.Right,
        cancelPeriod: 100,
        swipeThreshold: 10
      }
      ...
    })

  @extends Em.Gesture
*/


Em.SwipeGestureRecognizer = Em.Gesture.extend({
  
  /**
    The period (ms) in which the gesture should have been recognized. 

    @private
    @type Number
  */
  cancelPeriod: 100,
  swipeThreshold: 50,

  /*
    You should set up depending on your device factor and view behaviors.
    Distance is calculated separately on vertical and horizontal directions depending 
    on the direction property.
  */
  initThreshold: 5,

  direction: Em.OneGestureDirection.Right,

  //..................................................
  // Private Methods and Properties

  numberOfRequiredTouches: 1,
  swipeDirection: null,
  _initialLocation: null,
  _previousLocation: null,
  _cancelTimeout: null,


  /**
    The pixel distance that the fingers need to move before this gesture is recognized.

    @private
    @type Number
  */


  didBecomePossible: function() {

    this._previousLocation = this.centerPointForTouches(get(this.touches,'touches'));
  },

  shouldBegin: function() {
    var previousLocation = this._previousLocation;
    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var x = previousLocation.x;
    var y = previousLocation.y;
    var x0 = currentLocation.x;
    var y0 = currentLocation.y;

  //  var distance = Math.sqrt((x -= x0) * x + (y -= y0) * y);

    var shouldBegin = false;

    if ( this.direction & Em.OneGestureDirection.Right ) {
      shouldBegin = ( (x0-x) > this.initThreshold);
    } 
    if ( !shouldBegin && ( this.direction & Em.OneGestureDirection.Left )  ) {
      shouldBegin = ( (x-x0) > this.initThreshold);
    } 
    if ( !shouldBegin && ( this.direction & Em.OneGestureDirection.Down )  ) {
      shouldBegin = ( (y0-y) > this.initThreshold);
    } 
    if ( !shouldBegin && ( this.direction & Em.OneGestureDirection.Up ) ) {
      shouldBegin = ( (y-y0) > this.initThreshold);
    }

    return shouldBegin;
  },

  didBegin: function() {

    this._initialLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var that = this;

    this._cancelTimeout = window.setTimeout( function() {
      that._cancelFired(that);
    }, this.cancelPeriod);

  },

  didChange: function() {

    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));
    var x = this._initialLocation.x;
    var y = this._initialLocation.y;

    var x0 = currentLocation.x;
    var y0 = currentLocation.y;

    var isValidMovement = false;

    if ( this.direction & Em.OneGestureDirection.Right ) {
      
      isValidMovement = ( (x0-x) > this.swipeThreshold);
      this.swipeDirection = Em.OneGestureDirection.Right; 

    } 
    if ( !isValidMovement && ( this.direction & Em.OneGestureDirection.Left )  ) {
      
      isValidMovement = ( (x-x0) > this.swipeThreshold);
      this.swipeDirection = Em.OneGestureDirection.Left; 

    } 
    if ( !isValidMovement && ( this.direction & Em.OneGestureDirection.Down )  ) {

      isValidMovement = ( (y0-y) > this.swipeThreshold);
      this.swipeDirection = Em.OneGestureDirection.Down; 

    } 
    if ( !isValidMovement && ( this.direction & Em.OneGestureDirection.Up ) ) {

      isValidMovement = ( (y-y0) > this.swipeThreshold);
      this.swipeDirection = Em.OneGestureDirection.Up; 

    }

    if ( isValidMovement ) {

      this._disableCancelFired();
      set(this, 'state', Em.Gesture.ENDED)

      var eventName = get(this, 'name')+'End';
      this.attemptGestureEventDelivery(eventName);
      this._resetState(); 
      
    }

  },

  // touch end should cancel the gesture
  shouldEnd: function() {
    
    this._cancelFired();

    return  false;

  },

  _cancelFired: function() {

    this._disableCancelFired();
    set(this, 'state', Em.Gesture.CANCELLED);

    var eventName = get(this, 'name')+'Cancel';
    this.attemptGestureEventDelivery(eventName);
    this._resetState(); 
    
  },

  _disableCancelFired: function() {

     window.clearTimeout( this._cancelTimeout );

  },

  toString: function() {
    return Em.SwipeGestureRecognizer+'<'+Em.guidFor(this)+'>';
  }

});

Em.Gestures.register('swipe', Em.SwipeGestureRecognizer);


})({});


(function(exports) {






})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch 
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


Em.GestureDelegates = Em.Object.create({

  _delegates: {},

  add: function(delegate) {
    this._delegates[ delegate.get('name') ] = delegate;
  },

  find: function( name ) {
    return this._delegates[name];
  },

  clear: function() {
    this._delegates = {};
  }


});



})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch 
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*
 Delegate implements the logic of your application's gesture-recognition behavior.
 Set up your gestures to use a GestureDelegate to coordinate the gesture recognition based 
 on the current status of your Application. 
 */
Em.GestureDelegate = Em.Object.extend({

  /*
  * Name of the gestureDelegate.
	* It will be used on gestureOptions to assign a gestureDelegate to a specific gesture.
  */
  name: null,

  init: function(){
    this._super();
  },

	/*
  Ask the delegate if a gesture recognizer should receive a touch event.
  */
  shouldReceiveTouch: function(gesture, view, event) {
    return true; 
  }


});


})({});


(function(exports) {
// ==========================================================================
// Project:  Ember Touch
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Em.get;
var set = Em.set;

/** 
  @class
  
  Extends Em.View by making the init method gesture-aware.

  @extends Em.Object
*/
Em.View.reopen(
/** @scope Em.View.prototype */{

  /**
    The Em.GestureManager instance which will manager the gestures of the view.    
    This object is automatically created and set at init-time.

    @default null
    @type Array
  */
  eventManager: null,

  /**
    Inspects the properties on the view instance and create gestures if they're 
    used.
  */
  init: function() {
    this._super();

    var knownGestures = Em.Gestures.knownGestures();
    var eventManager = get(this, 'eventManager');

    if (knownGestures && !eventManager) {
      var gestures = [];

      var manager = Em.GestureManager.create({
        appGestureManager: Em.AppGestureManager
      });


      for (var gesture in knownGestures) {
        if (this[gesture+'Start'] || this[gesture+'Change'] || this[gesture+'End']) {

          var optionsHash;
          if (this[gesture+'Options'] !== undefined && typeof this[gesture+'Options'] === 'object') {
            optionsHash = this[gesture+'Options'];
          } else {
            optionsHash = {};
          }

          optionsHash.name = gesture;
          optionsHash.view = this;
          optionsHash.manager = manager;

          gestures.push(knownGestures[gesture].create(optionsHash));
        }
      }
      

      set(manager, 'view', this);
      set(manager, 'gestures', gestures);

      set(this, 'eventManager', manager);
 
    }
  },

  unblockGestureRecognizer: function() {

    var eventManager = get(this, 'eventManager');
    eventManager.appGestureManager.unblock(this);

  }

});


})({});


(function(exports) {







})({});


(function(exports) {
//require('ember-views');


})({});
