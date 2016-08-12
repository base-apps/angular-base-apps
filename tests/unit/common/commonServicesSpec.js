describe('Common Angular Base Apps Services', function() {
  beforeEach(module('base.core'));

  it('should exist', inject(function(BaseAppsApi) {
    expect(BaseAppsApi).not.toEqual(null);
  }));


  //testing listeners
  it('should subscribe and fire a new listener', inject(function(BaseAppsApi) {
    var response = '';
    var listenerName = 'testListener';
    var listener = function() {
      response = 'fired';
      return true;
    };

    BaseAppsApi.subscribe(listenerName, listener);

    //make sure cb didn't get fired
    expect(response).toEqual('');

    BaseAppsApi.publish(listenerName, '');

    expect(response).toEqual('fired');

  }));

  it('should pass on a message', inject(function(BaseAppsApi) {
    var response = '';
    var listenerName = 'testListener';
    var listener = function(msg) {
      response = msg;
      return true;
    };

    BaseAppsApi.subscribe(listenerName, listener);

    //make sure cb didn't get fired
    expect(response).toEqual('');

    //fire a listener
    BaseAppsApi.publish(listenerName, 'fired');

    expect(response).toEqual('fired');

    //make sure response changes with each message
    BaseAppsApi.publish(listenerName, 'fired again');

    expect(response).toEqual('fired again');

  }));

  it('should fire all subscribed listeners', inject(function(BaseAppsApi) {
    var response = '';
    var response2 = '';
    var listenerName = 'testListener';
    var listener = function(msg) {
      response = msg;
      return true;
    };

    var listener2 = function(msg) {
      response2 = msg;
      return true;
    };

    BaseAppsApi.subscribe(listenerName, listener);
    BaseAppsApi.subscribe(listenerName, listener2);

    //make sure cb didn't get fired
    expect(response).toEqual('');
    expect(response2).toEqual('');

    //fire a listener
    BaseAppsApi.publish(listenerName, 'fired');

    expect(response).toEqual('fired');
    expect(response2).toEqual('fired');
  }));

  it('should modify and get settings', inject(function(BaseAppsApi) {
    var settings     = {};
    var testSettings = { testSettings: 1 };
    var newSettings  = { testSettings: 2 };

    BaseAppsApi.modifySettings(testSettings);

    settings = BaseAppsApi.getSettings();

    //make sure settings are empty
    expect(settings.testSettings).toEqual(1);

    //extend settings
    settings = BaseAppsApi.modifySettings(newSettings);

    expect(settings.testSettings).toEqual(2);
  }));

  it('should generate unique IDs', inject(function(BaseAppsApi) {
    var ids = [];
    var duplicates = [];

    for(var i = 0; i < 100; i++) {
      var generatedId = BaseAppsApi.generateUuid();
      if(ids.indexOf(generatedId) > -1) {
        duplicates.push(generatedId);
      }

      ids.push(generatedId);
    }

    expect(duplicates).toEqual([]);

  }));


  describe('utils factory', function() {
    it('should exist', inject(function(Utils){
      expect(Utils).not.toEqual(null);
    }));
  });
});
