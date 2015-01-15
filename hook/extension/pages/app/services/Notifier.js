app.factory('Notifier', function($modal) {

    return function(title, content) {

        content = '<div class="modal-header"><h3 class="modal-title">' + title + '</h3></div><div class="modal-body">' + content + '</div>'; //<div class="modal-footer"><button class="btn btn-default" data-ng-click="closeModal()">Close</button></div>';

        var modalInstance = $modal.open({
            template: content,
            size: 'lg'
                // controller: 'ModalInstanceCtrl',
                // size: size,
                // resolve: {
                //     items: function() {
                //         return $scope.items;
                //     }
                // }
        });

        // $scope.closeModal = function () {
        //     console.log('clllooossseee');
        // };

        // modalInstance.result.then(function(selectedItem) {
        //     $scope.selected = selectedItem;
        // }, function() {
        //     $log.info('Modal dismissed at: ' + new Date());
        // });
    };
});
