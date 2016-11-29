import App from "app/app";
import { View } from "marionette";
import {attributes, className, tagName, template, on} from "modules/common/controllers/decorators";
import AddTodo from "modules/common/components/add-todo-item";
import TodoItem from "modules/common/components/todo-item";
import TodoFooter from "modules/common/components/todo-footer";
import Template from "./home.html";
import "./home.scss";

/**
 * Home view
 *
 * @module modules/pages/home
 * @exports HomeView
 */
@className("home")
@template(Template)
@attributes({
    components: {},
    componentChannels: {},
    _count: {},
    selectedItems: {},
    todoCount: 0,
    rendered: false
})
class HomeView extends View {

    constructor () {
        super();
    }

    /**
     * When the template of the page has been updated, re render the template
     * (This won't preserve state)
     */
    initialize () {
        const that = this;
        if (module.hot) {
            /** Require the template & re-render :) **/
            module.hot.accept("./home.html", res => {
                that.$el.find("#content-container").html(_.template(require("./home.html")));
            });

        }
    }

    /**
     * On render, we want to add the navigation
     *
     * @protected
     */
    onRender () {
        this.setupComponents();
        this.setupComponentEventListeners();
        this.rendered = true;
    }

    setupComponents () {
        if(!this.rendered) {
            this.registerComponent("add-todo-item", AddTodo, this.$el.find("#add-todo"));
            this.registerComponent("todo-footer", TodoFooter, this.$el.find("#todo-footer"), {
                count: this.todoCount
            });
        }
    }

    setupComponentEventListeners () {
        const that = this;

        /** We can listen to events emitted by the component. **/
        this.componentChannels["add-todo-item"].on("add-item", value => {
            const todoItem = this.registerComponent("todo-item", TodoItem, this.$el.find("#todo-list"), { value: value }, true);

            let todoItemChannel = this.componentChannels[todoItem];
            todoItemChannel.trigger("dom-ready", this.components[todoItem].element);

            /**
             * When one of the todo items changes state, update other components.
             */
            todoItemChannel.on("stateChange", ({state, target}) => {
                if(state) {
                    this.todoCount--;
                } else {
                    this.todoCount++;
                }

                if(target !== undefined) {
                    if(state) {
                        that.selectedItems[target] = state;
                    } else {
                        delete that.selectedItems[target];
                    }
                }

                this.componentChannels["todo-footer"].trigger("update-state", {
                    count: this.todoCount,
                    hasItems: (this.$el.find("#todo-list").children().length !== 0)
                });

            });

            todoItemChannel.on("remove-item", value => {
                this.$el.find(`[data-id='${value}']`).remove();

                this.componentChannels["todo-footer"].trigger("update-state", {
                    count: this.$el.find("#todo-list").children().length,
                    hasItems: (this.$el.find("#todo-list").children().length !== 0)
                });

                this.todoCount = this.$el.find("#todo-list").children().length;

                delete this.componentChannels[value];
            });

            this.todoCount++;

            this.componentChannels["todo-footer"].trigger("update-state", {
                count: this.todoCount,
                hasItems: (this.$el.find("#todo-list").children().length !== 0)
            });

        });

        /**
         * When the footer tells us to clear all completed items, we'll notify the todo-item's
         */
        this.componentChannels["todo-footer"].on("clear-completed", value => {
            for (let key in this.selectedItems) {
                if(this.selectedItems[key]) {
                    this.componentChannels[key].trigger("clear-completed", key);
                    delete this.selectedItems[key];
                }
            }

            this.componentChannels["todo-footer"].trigger("update-state", {
                count: this.todoCount,
                hasItems: (this.$el.find("#todo-list").children().length !== 0)
            });
        });

        /**
         * When the footer tells us to show only a specific type, we'll notify the items.
         */
        this.componentChannels["todo-footer"].on("show-type", value => {
            for (let key in this.componentChannels) {
                if(/^todo-item/.test(key)) {
                    this.componentChannels[key].trigger("show-type", value);
                }
            }

            this.componentChannels["todo-footer"].trigger("update-state", {
                count: this.todoCount,
                hasItems: (this.$el.find("#todo-list").children().length !== 0)
            });
        });

    }

    /**
     * Register the component.
     *
     * @param componentName {String} Name the component will be registered under.
     * @param component {HTMLElement} The component you're registering.
     * @param el {jQuery} Container/Element you're putting the component into.
     * @param properties {Object} Properties you wish to apply to the component.
     */
    registerComponent (componentName, component, el, properties) {
        let Component = App.Compontents;
        let localCompName;

        if(undefined !== this.components[componentName]) {

            if(undefined === this._count[componentName]) {
                this._count[componentName] = 0;
            }
            
            localCompName = `${componentName}-${this._count[componentName]}`;
            this._count[componentName]++;

        } else {
            localCompName = componentName;
        }

        const local = Component.register(componentName, component, properties, localCompName);
        const componentObject = Component.getComponent(localCompName);

        /** Store references to the component & radio channels **/
        this.components[localCompName] = {
            element: componentObject.component,
            module: componentObject.componentModule
        };

        this.componentChannels[localCompName] = componentObject.radioChannel || {};
        el.append(local);

        return localCompName;
    }
}

export default HomeView;