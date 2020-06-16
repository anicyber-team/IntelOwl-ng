import { Component, OnDestroy } from '@angular/core';
import {
  JobStatusIconRenderComponent,
  ViewResultButtonComponent,
  TagsRenderComponent,
} from '../../@theme/components/smart-table/smart-table';
import { LocalDataSource } from 'ng2-smart-table';
import { JobService } from '../../@core/services/job.service';
import { Job, Tag } from '../../@core/models/models';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/@core/services/toast.service';

@Component({
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnDestroy {
  private jobSub: Subscription;
  private tagSub: Subscription;
  private jobs: Job[];
  filterEl: string = null;
  filterField: string = null;
  iconRotateBool: boolean = false;

  // Pie Chart Data
  pieChartData: any = {};

  // ng2-smart-table data source
  source: LocalDataSource = new LocalDataSource();

  // ng2-smart-table settings
  settings = {
    actions: {
      add: false,
      edit: false,
      delete: false,
    },
    pager: {
      display: true,
      perPage: 10,
    },
    columns: {
      result: {
        title: 'Result',
        type: 'custom',
        width: '3%',
        filter: false,
        sort: false,
        renderComponent: ViewResultButtonComponent,
      },
      id: {
        title: 'id',
        width: '3%',
      },
      observable_name: {
        title: 'Name',
        valuePrepareFunction: (c, r) => r.observable_name || r.file_name,
      },
      tags: {
        title: 'Tags',
        type: 'custom',
        filter: false,
        sort: false,
        renderComponent: TagsRenderComponent,
        onComponentInitFunction: (instance: any) =>
          this.filterJobsByTag(instance),
      },
      observable_classification: {
        title: 'Type',
        width: '20%',
        filter: false,
        valuePrepareFunction: (c, r) =>
          r.observable_classification || r.file_mimetype,
      },
      analyzers_requested: {
        title: 'Analyzers Called',
        width: '10%',
        filter: false,
        valuePrepareFunction: (c, r) => {
          const n1 = r.analyzers_to_execute.length;
          const n2 = r.analyzers_requested.length;
          return n2 ? `${n1}/${n2}` : 'all';
        },
      },
      process_time: {
        title: 'Process Time (s)',
        width: '10%',
        filter: false,
        valuePrepareFunction: (c, r) => {
          const date1 = new Date(r.received_request_time).getUTCSeconds();
          const date2 = new Date(r.finished_analysis_time).getUTCSeconds();
          return Math.abs(date2 - date1);
        },
      },
      status: {
        title: 'Success',
        type: 'custom',
        width: '5%',
        filter: false,
        renderComponent: JobStatusIconRenderComponent,
      },
    },
  };

  constructor(
    private readonly jobService: JobService,
    private readonly toastr: ToastService
  ) {
    this.jobSub = this.jobService.jobs$.subscribe(
      async (res: Job[]) => this.initData(res),
      async (err: any) =>
        this.toastr.showToast(
          err.message,
          'Failed to fetch Data. Are you online ?',
          'error'
        )
    );
  }

  private async initData(res: Job[]): Promise<void> {
    this.jobs = res;
    if (this.jobs) {
      this.source.load(this.jobs);
      this.pieChartData['status'] = await this.constructPieData(
        this.jobs,
        'status'
      );
      this.pieChartData['type'] = await this.constructPieData(
        this.jobs,
        'type'
      );
      this.pieChartData[
        'observable_classification'
      ] = await this.constructPieData(this.jobs, 'observable_classification');
      this.pieChartData['file_mimetype'] = await this.constructPieData(
        this.jobs,
        'file_mimetype'
      );
    }
  }

  private async constructPieData(
    jobs: Job[],
    field: string
  ): Promise<Array<{ name: string; value: number }>> {
    const fieldValuesMap: Map<string, number> = new Map();

    jobs.forEach((job) => {
      let keys: string[] = [];

      if (job[field] === null || job[field] === '') {
        return; // jump to next iteration
      } else if (job[field] instanceof Object && job[field].length > 0) {
        keys = job[field];
      } else {
        keys.push(job[field]);
      }

      keys.forEach((k) => {
        if (fieldValuesMap.get(k) === undefined) {
          fieldValuesMap.set(k, 0);
        }
        fieldValuesMap.set(k, fieldValuesMap.get(k) + 1);
      });
    });

    const pieData: Array<{ name: string; value: number }> = [];

    fieldValuesMap.forEach((v, k) => {
      pieData.push({ name: k, value: v });
    });

    return pieData;
  }

  filterJobsByField(el: any, field: string): void {
    const filteredJobs = this.jobs.filter((job) => el.name === job[field]);
    this.filterField = field;
    this.filterEl = el.name;
    this.source.load(filteredJobs);
  }

  private filterJobsByTag(tagComponentInst: any) {
    this.tagSub = tagComponentInst.onTagClick.subscribe((t: Tag) => {
      const filteredJobs = this.jobs.filter((job) =>
        job.tags.some((o) => o.label === t.label)
      );
      this.filterField = 'Tag';
      this.filterEl = t.label;
      this.source.load(filteredJobs);
    });
  }

  async debouncedSync() {
    // this function is debounced by 2 seconds
    this.iconRotateBool = false;
    // reset filters
    this.filterField = null;
    this.filterEl = null;
    this.jobService.initOrRefresh().then(
      () =>
        this.toastr.showToast(
          'Dashboard is updated with latest data',
          'Sync successful!',
          'success'
        ),
      (err) => this.toastr.showToast(err.message, 'Sync failed!', 'error')
    );
  }

  resetFilters(): void {
    this.filterField = null;
    this.filterEl = null;
    this.source.load(this.jobs);
    this.source.reset();
  }

  ngOnDestroy(): void {
    this.jobSub && this.jobSub.unsubscribe();
    this.tagSub && this.tagSub.unsubscribe();
  }
}
