app.factory('NotifierService', function($modal) {

    return function(title, content) {

        content = '<div class="modal-header"><h3 class="modal-title">' + title + '</h3></div><div class="modal-body">' + content + '</div>'; //<div class="modal-footer"><button class="btn btn-default" data-ng-click="closeModal()">Close</button></div>';

        var modalInstance = $modal.open({
            template: content,
            size: 'lg'
        });
    };
});
