import App from "app/app";
import { View } from "marionette";
import {attribute, className, tagName, template, on} from "modules/common/controllers/decorators";
import AddTodo from "modules/common/components/add-todo-item";
import TodoItem from "modules/common/components/todo-item";
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
@attribute("components", {})
@attribute("componentChannels", {})
class HomeView extends View {

    constructor () {
        super();

        this._count = 0;
        this.todoCount = 0;
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

            module.hot.accept("modules/common/components/todo-item", elem => that.components["todo-item"].updateElement());
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
    }

    setupComponents () {
        let $componentContainer = this.$el.find("#component-container");

        this.registerComponent("add-todo-item", AddTodo, $componentContainer);
    }

    setupComponentEventListeners () {
        /** We can listen to events emitted by the component. **/
        this.componentChannels["add-todo-item"].on("add-item", value => {
            this.registerComponent("todo-item", TodoItem, this.$el.find("#component-container"), { value: value }, true);
            this.$el.find("#footer").show();
            this.todoCount++;
            this.$el.find("#todo-count").find("strong").text(`${this.todoCount}`);

            if(this.todoCount > 1) {
                this.$el.find("#grammar").text("items");
            } else {
                this.$el.find("#grammar").text("item")
            }

            let todoItemChannel;

            if(this._count > 0) {
                todoItemChannel = this.componentChannels[`todo-item-${this._count - 1}`];
            } else {
                todoItemChannel = this.componentChannels[`todo-item`];
            }

            todoItemChannel.on("stateChange", value => {
                if(value) {
                    this.todoCount--;
                } else {
                    this.todoCount++;
                }

                this.$el.find("#todo-count").find("strong").text(`${this.todoCount}`);
            })
        });



    }

    /**
     * Register the component.
     *
     * @param componentName {String} Name the component will be registered under.
     * @param component {HTMLElement} The component you're registering.
     * @param el {jQuery} Container/Element you're putting the component into.
     * @param properties {Object} Properties you wish to apply to the component.
     * @param isListItem {Boolean} Will render it regardless of if an element with that name exists already.
     */
    registerComponent (componentName, component, el, properties, isListItem) {
        let Component = App.Compontents;
        let localCompName;

        if(Component.getComponent(componentName) !== undefined && isListItem) {
            localCompName = `${componentName}-${this._count}`;
            this._count++;
        } else {
            localCompName = componentName;
        }

        Component.register(localCompName, component, properties, isListItem);
        const componentObject = Component.getComponent(localCompName);

        /** Store references to the component & radio channels **/
        this.components[componentObject.elementName] = {
            element: componentObject.component,
            module: componentObject.componentModule
        };

        this.componentChannels[componentObject.elementName] = componentObject.radioChannel || {};

        el.append(componentObject.component);
    }
}

export default HomeView;