import App from "app/app";
import { View } from "@jakejarrett/marionette-component";
import {attributes, className, tagName, template, on} from "marionette-decorators";
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
@attributes({
    _count: {},
    selectedItems: {},
    todoCount: 0,
    rendered: false
})
class HomeView extends View {

    get className () {
        return "home";
    }

    /**
     * Constructor
     */
    constructor () {
        super();
    }

    template (serializedModel) {
        return _.template(Template, serializedModel);
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
                that.render();

                // Ahh
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

    /**
     * Setup the initial components
     */
    setupComponents () {
        if(!this.rendered) {
            this.registerComponent(App.Compontents, "add-todo-item", AddTodo, this.$el.find("#add-todo"));
            this.registerComponent(App.Compontents, "todo-footer", TodoFooter, this.$el.find("#todo-footer"), {
                count: this.todoCount
            });
        }
    }

    setupComponentEventListeners () {
        const that = this;
        const addTodoItemChannel = this.getComponent("add-todo-item").radioChannel;
        const footerChannel = this.getComponent("todo-footer").radioChannel;

        /** We can listen to events emitted by the component. **/
        addTodoItemChannel.on("add-item", value => {
            const todoItem = this.registerComponent(App.Compontents, "todo-item", TodoItem, this.$el.find("#todo-list"), { value: value }, true);

            addTodoItemChannel.trigger("update-state", {
                hasItems: (this.$el.find("#todo-list").children().length !== 0)
            });

            let todoItemObj = this.getComponent(todoItem);
            let todoItemChannel = todoItemObj.radioChannel;
            todoItemChannel.trigger("dom-ready", todoItemObj.element);

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

                footerChannel.trigger("update-state", {
                    count: this.todoCount,
                    hasItems: (this.$el.find("#todo-list").children().length !== 0)
                });

            });

            todoItemChannel.on("remove-item", value => {
                this.$el.find(`[data-id='${value}']`).remove();

                footerChannel.trigger("update-state", {
                    count: this.$el.find("#todo-list").children().length,
                    hasItems: (this.$el.find("#todo-list").children().length !== 0)
                });

                this.todoCount = this.$el.find("#todo-list").children().length;

                delete this._componentChannels[value];
            });

            this.todoCount++;

            footerChannel.trigger("update-state", {
                count: this.todoCount,
                hasItems: (this.$el.find("#todo-list").children().length !== 0)
            });

        });

        /**
         * When the footer tells us to clear all completed items, we'll notify the todo-item's
         */
        footerChannel.on("clear-completed", value => {
            for (let key in this.selectedItems) {
                if(this.selectedItems[key]) {
                    this._componentChannels[key].trigger("clear-completed", key);
                    delete this.selectedItems[key];
                }
            }

            footerChannel.trigger("update-state", {
                count: this.todoCount,
                hasItems: (this.$el.find("#todo-list").children().length !== 0)
            });
        });

        /**
         * When the footer tells us to show only a specific type, we'll notify the items.
         */
        footerChannel.on("show-type", value => {
            for (let key in this._componentChannels) {
                if(/^todo-item/.test(key)) {
                    this._componentChannels[key].trigger("show-type", value);
                }
            }

            footerChannel.trigger("update-state", {
                count: this.todoCount,
                hasItems: (this.$el.find("#todo-list").children().length !== 0)
            });
        });

        /**
         * When we click the toggle all checkbox.
         */
        addTodoItemChannel.on("toggle-all", toggle => {
            for (let key in this._componentChannels) {
                if(/^todo-item/.test(key)) {
                    this._componentChannels[key].trigger("toggle", toggle);
                }
            }
        });

    }

}

export default HomeView;