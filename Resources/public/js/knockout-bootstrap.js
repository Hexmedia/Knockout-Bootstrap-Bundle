//UUID
ko.bootstrap = {
	s4: function() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	},
	guid: function() {
		return this.s4() + this.s4() + "-" + this.s4() + "=" + this.s4() + "=" + this.s4() + "=" + this.s4() + this.s4() + this.s4();
	},
	id: function() {
		return this.s4();
	}
};

ko.bootstrap.te = new ko.nativeTemplateEngine();

ko.bootstrap.te.addTemplate = function(name, html) {
	document.write("<script type=\"text/html\" id=\"" + name + "\">" + html + "</script>");
};

// Outer HTML
(function($) {
	$.fn.outerHtml = function() {
		var elem, attrs;
		if (this.length === 0) {
			return false;
		}
		elem = this[0], name = elem.tagName.toLowerCase();
		if (elem.outerHTML) {
			return elem.outerHTML;
		}
		attrs = $.map(elem.attributes, function(i) {
			return i.name + "=\"" + i.value + "\"";
		});
		return "<" + name + (attrs.length > 0 ? " " + attrs.join(" ") : "") + ">" + elem.innerHTML + "</" + name + ">";
	};
})(jQuery);



// Bind Twitter Alert
ko.bindingHandlers.alert = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var $element, alertInfo, dismissBtn, alertMessage;
		$element = $(element);
		alertInfo = ko.utils.unwrapObservable(valueAccessor());

		dismissBtn = $("<button/>", {
			"type": "button",
			"class": "close",
			"data-dismiss": "alert"
		}).html("&times;");

		alertMessage = $("<p/>").html(alertInfo.message);

		$element.addClass("alert alert-" + alertInfo.priority)
				.append(dismissBtn)
				.append(alertMessage);
	}
};
(function($) {
	ko.bootstrap.ModalModel = function(options) {
		var self = this;

		options = $.extend({
			buttonTemplate: "kb_modal_button"
		}, options || {});

		self.buttonTemplate = "kb_modal_button";

		self.title = ko.observable();
		self.body = ko.observable();
		self.buttonsData = ko.observableArray([]);
		self.id = options.id || "modal_" + ko.bootstrap.id();

		self.modal = function() {
			return $("#" + self.id);
		};

		self.buttons = ko.computed(function() {
			for (var b in self.buttonsData()) {
				self.buttonsData()[b].modal(self);
			}

			return self.buttonsData();
		});

		self.show = function() {
			self.modal().modal("show");
		};

		self.hide = function() {
			self.modal().modal("hide");
		};

		self.close = function() {
			self.hide();
			self.remove();
		};

		self.remove = function() {
			self.modal().remove();
		};
	};

	ko.bootstrap.ModalButtonModel = function(options) {
		var self = this;

		if (typeof options === "undefined") {
			options = {
			};
		}

		options = $.extend({
			clazz: "btn",
			name: "Cancel",
			action: null,
			data: {}
		}, options);

		self.clazz = ko.observable(options.clazz);
		self.name = ko.observable(options.name);
		self.modal = ko.observable();
		self.action = options.action;
		self.caller = null;
		self.data = ko.observable(options.data);

		self.id = ko.computed(function() {
			return (self.modal() ? self.modal().id : null);
		});

		self.onclick = function(a, b, c) {
			if (typeof self.action === "function") {
				self.action({});
			} else {
				self.modal().close();
			}
		}
		;
	};

	ko.bootstrap.te.addTemplate("kb_modal", "\
	<div class=\"modal hide fade\" data-bind=\"attr: {'id': id}\">\
		<div class=\"modal-header\">\
			<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\
			<h3 data-bind=\"text: title\">Modal header</h3>\
		</div>\
		<div class=\"modal-body\" data-bind=\"html:body\">\
		</div>\
		<div class=\"modal-footer\" data-bind=\"foreach: buttons\">\
			<div data-bind=\"modal_button: {'template' : $parent.buttonTemplate, data: $data}\"></div>\
		</div>\
	</div>");

	ko.bootstrap.te.addTemplate("kb_modal_button", "\
			<button data-bind=\"text:name, attr: {'class': clazz}\"></div>\
		");

	ko.bindingHandlers.modal = {
		init: function() {
			return {"controlsDescendantBindings": false};
		},
		update: function(element, valueAccessor, allBindingsAccessor, vm, bindingContext) {
			var viewModel = valueAccessor(), allBindings = allBindingsAccessor(), template, action;

			template = allBindings.headerTemplate || "kb_modal";
			action = allBindings.action || "click";

			$(element).bind(action, function() {
				ko.renderTemplate(template, viewModel, {templateEngine: ko.bootstrap.te}, $("<div />").appendTo($("body")), "replaceNode");

				viewModel().show();
				viewModel().caller = element;

				return false;
			});
		}
	};

	ko.bindingHandlers.modal_button = {
		init: function() {
			return {"controlsDescendantBindings": false};
		},
		update: function(element, valueAccessor, allBindingsAccessor, vm, bindingContext) {
			var viewModel = valueAccessor(), allBindings = allBindingsAccessor(), template, node;

			template = allBindings.template || "kb_modal_button";

			ko.renderTemplate(template, viewModel.data, {templateEngine: ko.bootstrap.te}, element, "replaceChildren");
			//Doing node replace with remembering element

			node = $(element).children();

			$(element).before(node);
			$(element).remove();

			$(node).click(function(a) {
				vm.onclick(viewModel.data.data());

				return false;
			});
		}
	};

	ko.bindingHandlers.modal_button_action = {
		init: function() {
			return {"controlsDescendantBindings": false};
		},
		update: function(element, valueAccessor, allBindingsAccessor, vm, bindingContext) {
			var viewModel = valueAccessor(), allBindings = allBindingsAccessor(), template, action;

			console.log(viewModel);

			$(element).click(function() {
				vm.onclick(viewModel);

				return false;
			});
		}
	};
}(jQuery));//Depends on modal.js
(function($) {
	ko.bootstrap.ConfirmModel = function(options) {
		var self = this, okButton, cancelButton;

		if (typeof options === "undefined") {
			options = {
				action: function() {
				}
			};
		}

		options = $.extend({
			message: "Do you want to do this?",
			data: {}
		}, options);

		self.action = options.action;

		self.data = ko.observable(options.data);

		cancelButton = new ko.bootstrap.ModalButtonModel({
			clazz: "btn btn-danger",
			name: "Cancel",
			data: self.data()
		});

		okButton = new ko.bootstrap.ModalButtonModel({
			clazz: "btn btn-success",
			name: "Ok",
			action: function() {
				self.action(self);
				self.close();
			},
			data: self.data()
		});

		self.body(options.message);

		self.buttonsData.push(cancelButton);
		self.buttonsData.push(okButton);
	};

	ko.bootstrap.ConfirmModel.prototype = new ko.bootstrap.ModalModel();
	ko.bootstrap.ConfirmModel.prototype.constructor = ko.bootstrap.ConfirmModel;

	ko.bootstrap.te.addTemplate("kb_confirm", "\
	<div class=\"modal hide fade\" data-bind=\"attr: {'id': id}\">\
		<div class=\"modal-body\" data-bind=\"html:body\">\
		</div>\
		<div class=\"modal-footer\" data-bind=\"foreach: buttons\">\
			<div data-bind=\"modal_button: {'template' : $parent.buttonTemplate, data: $data}\"></div>\
		</div>\
	</div>");

	ko.bindingHandlers.confirm = {
		init: function() {
			return ko.bindingHandlers.modal.init();
		},
		update: function(element, valueAccessor, allBindingsAccessor, vm, bindingContext) {
			var viewModel = valueAccessor(), allBindings = allBindingsAccessor(), ret, action;

			allBindings.headerTemplate = allBindings.headerTemplate || "kb_confirm";

			ret = ko.bindingHandlers.modal.update(element, valueAccessor, allBindingsAccessor, vm, bindingContext);

			action = allBindings.action || "click";

			$(element).bind('click', function() {
//				viewModel().data(vm);
			});

			return ret;
		}
	};
}(jQuery));
(function($) {
	ko.bootstrap.PaginationModel = function(options) {
		var self = this;

		options = $.extend({
			page: 1,
			pageSize: 10,
			showPages: 10,
			itemCount: 1
		}, options || {});

		self.page = ko.observable(options.page);
		self.pageSize = ko.observable(10);
		self.showPages = ko.observable(10);
		self.itemCount = ko.observable();

		self.totalPages = ko.computed(function() {
			return Math.ceil(self.itemCount() / self.pageSize()) || 1;
		});

		self.goToPage = function(p) {
			if (p >= 1 && p <= self.totalPages()) {
				self.page(p);

				if (typeof options.goToPage === "function") {
					options.goToPage(p);
				}
			}
		};

		self.isFirstPage = ko.computed(function() {
			return self.page() === 1;
		});

		self.isLastPage = ko.computed(function() {
			return self.totalPages() === self.page();
		});

		self.prevPage = function() {
			self.goToPage(self.page() - 1);
		};

		self.nextPage = function() {
			self.goToPage(self.page() + 1);
		};

		self.firstPage = function() {
			self.goToPage(1);
		};

		self.lastPage = function() {
			self.goToPage(self.totalPages());
		};


		this.pages = ko.computed(function() {
			var pages = [], s, e, r;

			s = Math.floor(Math.max(1, self.page() - self.showPages() / 2));
			e = Math.floor(Math.min(self.totalPages(), self.page() + self.showPages() / 2));
			r = e - s;

			if (r < self.showPages()) {
				if (e === self.totalPages() && s !== 1) {
					s = Math.floor(Math.max(1, s - self.showPages() + r));
				} else if (s === 1 && e !== self.totalPages()) {
					e = Math.floor(Math.min(self.totalPages(), self.showPages()));
				}
			}

			for (; s <= e; s++) {
				pages.push(s);
			}

			return pages;
		});
	};

	ko.bootstrap.te.addTemplate("kb_pagination", "\
			<!-- ko if: totalPages() > 1 -->\
				<div class=\"pagination\">\
					<ul>\
						<li data-bind=\"css:{disabled:isFirstPage()}\">\
							<a href=\"#\" data-bind=\"click: $root.firstPage\">&laquo; first</a>\
						</li>\
						<li data-bind=\"css:{disabled:isFirstPage()}\">\
							<a href=\"#\" data-bind=\"click: $root.prevPage\">&laquo; prev</a>\
						</li>\
						<!-- ko foreach: pages() -->\
							<li data-bind=\"css: { active: $data === ($root.page()), disabled: $data == ($root.page())}\">\
								<a href=\"#\" data-bind=\"text: $data, click: $root.goToPage\"/>\
							</li>\
						<!-- /ko -->\
						<li data-bind=\"css: { disabled: isLastPage() }\">\
							<a href=\"#\" data-bind=\"click: $root.nextPage\">next &raquo;</a>\
						</li>\
						<li data-bind=\"css: { disabled: isLastPage() }\">\
							<a href=\"#\" data-bind=\"click: $root.lastPage\">last &raquo;</a>\
						</li>\
					</ul>\
				</div>\
			<!-- /ko -->");

	ko.bindingHandlers.pagination = {
		init: function() {
			return {"controlsDescendantBindings": true};
		},
		update: function(element, valueAccessor, allBindingsAccessor) {
			var viewModel = valueAccessor(), allBindings = allBindingsAccessor(), template;

			template = allBindings.headerTemplate || "kb_pagination";

			ko.renderTemplate(template, viewModel, {templateEngine: ko.bootstrap.te}, element, "replaceNode");
		}
	};
})(jQuery);
// Bind Twitter Popover
ko.bindingHandlers.popover = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		// read popover options
		var popoverBindingValues, popoverTitle, tmplId, trigger, placement, tmplHtml, uuid, domId, childBindingContext, tmplDom,
				popoverOptions;

		popoverBindingValues = ko.utils.unwrapObservable(valueAccessor());

		// set popover title
		popoverTitle = popoverBindingValues.title;

		// set popover template id
		tmplId = popoverBindingValues.template;

		// set popover trigger
		trigger = "click";

		if (popoverBindingValues.trigger) {
			trigger = popoverBindingValues.trigger;
		}

		// update triggers
		if (trigger === "hover") {
			trigger = "mouseenter mouseleave";
		} else if (trigger === "focus") {
			trigger = "focus blur";
		}

		// set popover placement
		placement = popoverBindingValues.placement;

		// get template html
		tmplHtml = $("#" + tmplId).html();

		// create unique identifier to bind to
		uuid = ko.bootstrap.guid();
		domId = "ko-bs-popover-" + uuid;

		// create correct binding context
		childBindingContext = bindingContext.createChildContext(viewModel);

		// create DOM object to use for popover content
		tmplDom = $("<div/>", {
			"class": "ko-popover",
			"id": domId
		}).html(tmplHtml);

		// set content options
		options = {
			content: $(tmplDom[0]).outerHtml(),
			title: popoverTitle
		};

		if (placement) {
			options.placement = placement;
		}

		// Need to copy this, otherwise all the popups end up with the value of the last item
		popoverOptions = $.extend({}, ko.bindingHandlers.popover.options, options);

		// bind popover to element click
		$(element).bind(trigger, function() {
			var popoverAction, popoverTriggerEl, popoverInnerEl;

			popoverAction = "show";
			popoverTriggerEl = $(this);

			// popovers that hover should be toggled on hover
			// not stay there on mouseout
			if (trigger !== "click") {
				popoverAction = "toggle";
			}

			// show/toggle popover
			popoverTriggerEl.popover(popoverOptions).popover(popoverAction);

			// hide other popovers and bind knockout to the popover elements
			popoverInnerEl = $("#" + domId);
			$(".ko-popover").not(popoverInnerEl).parents(".popover").remove();

			// if the popover is visible bind the view model to our dom ID
			if ($("#" + domId).is(":visible")) {
				ko.applyBindingsToDescendants(childBindingContext, $("#" + domId)[0]);
			}

			// bind close button to remove popover
			$(document).on("click", "[data-dismiss=\"popover\"]", function(e) {
				popoverTriggerEl.popover("hide");
			});
		});

		// Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
		return {controlsDescendantBindings: true};
	},
	options: {
		placement: "right",
		title: "",
		html: true,
		content: "",
		trigger: "manual"
	}
};

// Bind Twitter Progress
ko.bindingHandlers.progress = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var $element = $(element), bar;

		bar = $("<div/>", {
			"class": "bar",
			"data-bind": "style: { width:" + valueAccessor() + " }"
		});

		$element.attr("id", ko.bootstrap.guid())
				.addClass("progress progress-info")
				.append(bar);
		ko.applyBindingsToDescendants(viewModel, $element[0]);
	}
};
(function($) {
	ko.bootstrap.TableModel = function() {
		var self = this;

		this.items = ko.observableArray([]);
		this.columns = ko.observableArray([]);

		this.itemsCount = ko.computed(function() {
			return self.items().length;
		});

		this.columnsCount = ko.computed(function() {
			return self.columns().length;
		});
	};

	ko.bootstrap.te.addTemplate("kb_table_header", "\
		<thead><tr data-bind=\"foreach: columns\">\
				<th data-bind=\"attr: {'class': name}\">\
					<div data-bind=\"html: display\"></div>\
				</th>\
		</tr></thead>");
	ko.bootstrap.te.addTemplate("kb_table_item", "<tbody data-bind=\"foreach: items\">\
			<tr data-bind=\"foreach: $parent.columns\">\
				<td data-bind=\"html: $parent[name]\"></td>\
			</tr></tbody>");

	ko.bindingHandlers.table = {
		init: function(element, valueAccessor, allBindingsAccessor) {
			return {"controlsDescendantBindings": true};
		},
		update: function(element, valueAccessor, allBindingsAccessor) {
			var viewModel = valueAccessor(), allBindings = allBindingsAccessor(), tableHeaderTemplate, tableListTemplate;

			tableHeaderTemplate = allBindings.headerTemplate || "kb_table_header";
			tableListTemplate = allBindings.itemTemplate || "kb_table_item";

			ko.renderTemplate(tableHeaderTemplate, viewModel, {templateEngine: ko.bootstrap.te}, $("<div />").appendTo(element), "replaceNode");
			ko.renderTemplate(tableListTemplate, viewModel, {templateEngine: ko.bootstrap.te}, $("<div />").appendTo(element), "replaceNode");
		}
	};
}(jQuery));
// Bind Twitter Tooltip
ko.bindingHandlers.tooltip = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var tooltipBindingValues, tooltipTitle, tooltipPlacement, options;

		// read tooltip options
		tooltipBindingValues = ko.utils.unwrapObservable(valueAccessor());

		// set tooltip title
		tooltipTitle = tooltipBindingValues.title;

		// set tooltip placement
		tooltipPlacement = tooltipBindingValues.placement;

		// set tooltip trigger
		tooltipTrigger = tooltipBindingValues.trigger;

		options = {
			title: tooltipTitle
		};

		ko.utils.extend(options, ko.bindingHandlers.tooltip.options);

		if (tooltipPlacement) {
			options.placement = tooltipPlacement;
		}

		if (tooltipTrigger) {
			options.trigger = tooltipTrigger;
		}

		$(element).tooltip(options);
	},
	options: {
		placement: "top",
		trigger: "hover"
	}
};

// Bind twitter typeahead
ko.bindingHandlers.typeahead = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var $element = $(element), typeaheadArr = ko.utils.unwrapObservable(valueAccessor());

		$element.attr("autocomplete", "off")
				.typeahead({
			"source": typeaheadArr
		});
	}
};
ko.bindingHandlers.radio = {
	init: function(element, valueAccessor, allBindings) {
		var $buttons, $element, observable;
		observable = valueAccessor();
		if (!ko.isWriteableObservable(observable)) {
			throw "You must pass an observable or writeable computed";
		}
		$element = $(element);
		if ($element.hasClass("btn")) {
			$buttons = $element;
		} else {
			$buttons = $(".btn", $element);
		}
		elementBindings = allBindings();
		$buttons.each(function() {
			var $btn, btn, radioValue;
			btn = this;
			$btn = $(btn);
			radioValue = elementBindings.radioValue || $btn.attr("data-value") || $btn.attr("value") || $btn.text();
			$btn.bind("click", function() {
				observable(ko.utils.unwrapObservable(radioValue));
			});
			return ko.computed({
				disposeWhenNodeIsRemoved: btn,
				read: function() {
					$btn.toggleClass("active", observable() === ko.utils.unwrapObservable(radioValue));
				}
			});
		});
	}
};
ko.bindingHandlers.checkbox = {
	init: function(element, valueAccessor) {
		var $element, observable;

		observable = valueAccessor();

		if (!ko.isWriteableObservable(observable)) {
			throw "You must pass an observable or writeable computed";
		}

		$element = $(element);
		$element.bind("click", function() {
			observable(!observable());
		});

		ko.computed({
			disposeWhenNodeIsRemoved: element,
			read: function() {
				$element.toggleClass("active", observable());
			}
		});
	}
};
(function($) {
	ko.bootstrap.CarouselModel = function(options) {
		var self = this;

		options = $.extend({
			slides: []
		}, options || {});

		self.slides = ko.observableArray(options.slides);
		self.itemTemplate = options.itemTemplate || "kb_carousel_item";

		self.addSlide = function(slide) {
			this.slides.push(slide);
		};

		self.removeLastSlide = function() {
			this.slides.pop();
		};

		self.removeFirstSlide = function() {
			this.slides.shift();
		};

		self.removeSlide = function(slide) {
			var slides, i;

			for (i in slides) {
				slides = this.slides();

				if (slides[i].title === slide.title && slides[i].image === slide.image && slides[i].text == slide.text) {
					this.slides.splice(i, i);
				}
			}
		};

		self.carousel = ko.observable();

		self.id = "carousel_" + ko.bootstrap.id();

		self.goTo = function(to) {
			if (to > 0 && to < self.carousel().lenght) {
				$(self.carousel()).carousel(to);
			}
		};

		self.cycle = function() {
			$(self.carousel()).carousel('cycle');
		};

		self.pause = function() {
			$(self.carousel()).carousel('pause');
		};

		self.prev = function() {
			$(self.carousel()).carousel('prev');
		};

		self.next = function() {
			$(self.carousel()).carousel('next');
		};

		self.interval = ko.observable();
	};

	ko.bootstrap.CarouselItemModel = function(options) {
		var self = this;

		options = $.extend({
			image: null,
			title: "Title",
			text: "text"
		}, options || {});

		self.image = ko.observable(options.image);
		self.title = ko.observable(options.title);
		self.text = ko.observable(options.text);
	};

	ko.bootstrap.te.addTemplate("kb_carousel_nav", "\
		<a class=\"carousel-control left\" data-slide=\"prev\" data-bind=\"attr: {'href':'#' + id}\">&lsaquo;</a>\
		<a class=\"carousel-control right\" data-slide=\"next\" data-bind=\"attr: {'href':'#' + id}\">&rsaquo;</a>\
	");

	ko.bootstrap.te.addTemplate("kb_carousel_inner", "\
		<div class=\"carousel-inner\" data-bind=\"foreach: slides\">\
			<div class=\"item\" data-bind=\"template: { 'name' : $parent.itemTemplate }\">\
			</div>\
		</div>\
	");

	ko.bootstrap.te.addTemplate("kb_carousel_item", "\
		<img src=\"#\" data-bind=\"attr: {'src' : image }\" />\
		<div class=\"carousel-caption\">\
			<h4 data-bind=\"text: title\">Second Thumbnail label</h4>\
			<p data-bind=\"text: text\">Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>\
		</div>\
	");

	ko.bootstrap.te.addTemplate("kn_carousel_indicators", "\
		<ol class=\"carousel-indicators\" data-bind=\"foreach: slides\">\
			<li data-bind=\"attr:{'data-slide-to': $index, 'data-target':'#' + $parent.id}\"></li>\
		</ol>\
	");

	ko.bindingHandlers.carousel = {
		init: function() {
			return {"controlsDescendantBindings": true};
		},
		update: function(element, valueAccessor, allBindingsAccessor) {
			var $element, viewModel = valueAccessor(), allBindings = allBindingsAccessor(), indicatorsTemplate, innerTemplate, navTemplate;

			indicatorsTemplate = allBindings.indicatorsTemplate || "kn_carousel_indicators";
			innerTemplate = allBindings.innerTemplate || "kb_carousel_inner";
			navTemplate = allBindings.navTemplate || "kb_carousel_nav";

			$element = $('<div />');
			$element.appendTo($(element));
			$element.addClass("carousel").addClass("slide");

			ko.renderTemplate(indicatorsTemplate, viewModel, {templateEngine: ko.bootstrap.te}, $('<div />').appendTo($element), "replaceNode");
			ko.renderTemplate(innerTemplate, viewModel, {templateEngine: ko.bootstrap.te}, $('<div />').appendTo($element), "replaceNode");
			ko.renderTemplate(navTemplate, viewModel, {templateEngine: ko.bootstrap.te}, $('<div />').appendTo($element), "replaceNode");

			$($element.find('li').get(0)).addClass('active');
			$($element.find('div.item').get(0)).addClass('active');

			$element.attr('id', viewModel().id);

			$element.carousel();
		}
	};
}(jQuery));
