import { IdToTitlePipe } from './pipes/id-to-title/id-to-title.pipe';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./app.component";
import { IsProjectSelectedPipe } from './pipes/is-project-selected/is-project-selected.pipe';
import { OrganizationsPipe } from './pipes/organizations/organizations.pipe';

@NgModule({
  declarations: [AppComponent, IdToTitlePipe, IsProjectSelectedPipe, OrganizationsPipe],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
