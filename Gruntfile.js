module.exports = function(grunt) {

  grunt.initConfig({

	  	clean: ['dist'],
				
		requirejs: {
			
			build: {
			
				options: {
					
					paths: {
                        'backbone': '../vendor/backbone-min',
                        'underscore': '../vendor/underscore-min',
                        'jquery': '../vendor/jquery-1.9.1.min',
                        'spinners': '../vendor/spinners.min',
                        'mousewheel': '../vendor/jquery.mousewheel'
					},
					
					baseUrl: 'src',
			    	
			    	name: 'gallery',
			    	
			    	out: 'dist/gallery.js',
			    	
			    	exclude: ['backbone', 'underscore', 'jquery', 'spinners', 'mousewheel']
				}
		
			}
		}
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  
  grunt.registerTask('default', ['clean', 'requirejs']);
};