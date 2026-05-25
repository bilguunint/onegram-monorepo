import { Component, OnInit, ViewChild, EventEmitter, Output, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { NgxEditorModule } from 'ngx-editor';
import { Editor } from 'ngx-editor';

@Component({
  selector: 'app-createtask',
  templateUrl: './createtask.component.html',
  styleUrls: ['./createtask.component.scss'],
  standalone:true,
  imports:[NgxEditorModule],
  schemas: [NO_ERRORS_SCHEMA]
})

/**
 * Tasks-create component
 */
export class CreatetaskComponent implements OnInit {

  // bread crumb items
  breadCrumbItems: Array<{}>;

  editor: Editor;

  form = new UntypedFormGroup({
    member: new UntypedFormArray([
      new UntypedFormControl(''),
    ]),
  });

  hidden: boolean;
  selected: any;
  html = '<p>Content of the editor.</p>';

  @Input() fromDate: Date;
  @Input() toDate: Date;
  @Output() dateRangeSelected: EventEmitter<{}> = new EventEmitter();

  @ViewChild('dp', { static: true }) datePicker: any;

  /**
   * Returns the form field value
   */
  get member(): UntypedFormArray { return this.form.get('member') as UntypedFormArray; }

  /**
   * Add the member field in form
   */
  addMember() {
    this.member.push(new UntypedFormControl());
  }

  /**
   * Onclick delete member from form
   */
  deleteMember(i: number) {
    this.member.removeAt(i);
  }

  constructor() { }

  ngOnInit() {
    this.editor = new Editor();
    this.breadCrumbItems = [{ label: 'Tasks' }, { label: 'Create Task', active: true }];

    this.hidden = true;
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  
}
