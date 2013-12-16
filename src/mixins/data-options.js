define([
	
], function() {
	
	return {
		
		
		parseOptions: function() {
			
			var self = this;
			
			var data = this.$el.data() || {};
			
			
			$.each(data, function(name, value) {
				
				if (data.hasOwnProperty(name)) {
					self.options[name] = value;
				}
			});
			
			return this;
		}
	};
});