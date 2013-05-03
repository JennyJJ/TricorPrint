'use strict';

$451.app.factory('OrderStatsService', function($resource, $http) {
    // query is not necessary here. it's just an example of how to add other methods
    return $resource($451.apiURL('orderstats'),{},{ query: {method: 'GET', params: {}, isArray: true}});
});

$451.app.factory('CategoryService', function($resource, $rootScope, ProductService){
    var catservice = $resource($451.apiURL('category/:interopID', {interopID: '@ID'}));
    var cats = null;
    var catsPopulateCompleted = false;
    $rootScope.$on('LogoutEvent', function(event, e){
        cats = null
        console.log('logout called - category service');
    });
    $rootScope.$on('LoginEvent', function(event, e){
        cats = null;
        console.log('login called - category service');
    });

    function populateCats(){
        if(!cats){
            cats = catservice.query(function(){catsPopulateCompleted = true; console.log('populate category success');});
            console.log('calling api for categories');
        }else{
            console.log('getting cached categories');
        }
    };
    function findCat(parent, interopID){
        if(!interopID)
            return {SubCategories: cats};
        if(parent.InteropID === interopID)
            return parent;
        var foundCat;
        for(var i = 0; i < parent.SubCategories.length; i++){
            var child = parent.SubCategories[i];
            if(child.InteropID === interopID)
                return child;

            if(child.SubCategories){
                foundCat = findCat(child, interopID)
                if(foundCat)
                    return foundCat;
            }
        }
    }
    return {
        tree: function(){
            populateCats();
            return cats;
        },
        getOne: function(interopID){
            if(!cats){ //starting session here, so no cached cats
                populateCats();
            }else{
                console.log('getting cached categories');
                var foundCat = findCat({SubCategories: cats}, interopID)

                if(!foundCat) //populateCats is probably not back yet
                {
                    console.log('not found');
                    foundCat = catservice.get({ interopID: interopID }, function(){
                        foundCat.Products = ProductService.search(foundCat.InteropID, '');
                    });
                }
                if(!foundCat.Products && foundCat.InteropID)
                {
                    console.log('products not found')
                    foundCat.Products = ProductService.search(foundCat.InteropID, '');
                }
                return foundCat;
            }
        }
    }
});

$451.app.factory('ProductService', function($resource){
    var productAPI = $resource($451.apiURL('product'), {}, {'search': {method: 'POST', isArray:true}});

    return {
       search: function(categoryInteropID, searchTerm){
           return productAPI.search({'CategoryInteropID': categoryInteropID, 'SearchTerms': searchTerm});
       },
        getOne: function(interopID){

        }
   }
});

$451.app.factory('LoginService', function($resource){
    return $resource($451.apiURL('login'));
});