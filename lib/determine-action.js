module.exports = function(params) {
 if(params['deleted'] === true) {
   console.log('erase');
   return 'erase';
 } else {
   console.log('deploy');
   return 'deploy';
 }
}
