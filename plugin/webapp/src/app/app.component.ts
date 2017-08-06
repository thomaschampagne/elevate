import {Component, OnInit} from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {

  private links: string[];

  ngOnInit(): void {
    this.links = ["Link 01", "Link 02", "Link 03"];
  }

  public onMenuClicked(link: string): void {
    alert("onMenuClicked " + link);
  }
}
