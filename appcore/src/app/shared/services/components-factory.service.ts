import { ComponentFactoryResolver, ComponentRef, Inject, Injectable, Type, ViewContainerRef } from "@angular/core";

@Injectable()
export class ComponentsFactoryService {
  constructor(@Inject(ComponentFactoryResolver) private readonly componentFactoryResolver: ComponentFactoryResolver) {}

  public create<C>(component: Type<C>, targetViewRef: ViewContainerRef): ComponentRef<C> {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
    return targetViewRef.createComponent(componentFactory);
  }
}
