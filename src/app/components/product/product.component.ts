import { Component, OnInit, AfterContentInit } from '@angular/core';
import { ContentstackQueryService } from '../../cs.query.service';
import { SeoService } from '../../seo.service';
import { Meta } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { actionPage } from 'src/app/store/actions/state.actions';
import { Entry } from 'contentstack';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductComponent implements OnInit {
  constructor(
    private cs: ContentstackQueryService,
    private router: Router,
    private seo: SeoService,
    private metaTagService: Meta,
    private store: Store
  ) {}
  page = 'Product';
  entries: Entry[] = [];
  products: any = {};
  archivedContent: any = [];
  productsString: string = '';

  filterObject(inputObject) {
    const unWantedProps = [
      'uid',
      '_version',
      '_owner',
      'ACL',
      '_in_progress',
      'created_at',
      'created_by',
      'updated_at',
      'updated_by',
      'publish_details',
    ];

    for (const key in inputObject) {
      unWantedProps.includes(key) && delete inputObject[key];
      if (typeof inputObject[key] !== 'object') {
        continue;
      }
      inputObject[key] = this.filterObject(inputObject[key]);
    }
    return inputObject;
  }

  getEntry() {
    Promise.all([
      this.cs.getEntryWithQuery('page', { key: 'url', value: '/products' }),
      this.cs.getEntryWithQuery(
        'products',
        { key: 'url', value: this.router.url },
        ['product_details.sku'],
        ['product_details.description', 'product_details.price']
      ),
    ]).then(
      (entries) => {
        this.entries = entries;
        this.products = entries[0][0][0];
        this.filterProductTypes(entries[1][0]);
        const pageData = this.filterObject(entries[0][0][0]);
        const productData = this.filterObject(entries[1][0]);
        this.productsString = JSON.stringify(this.products);
        this.products = productData[0];
        this.store.dispatch(actionPage({ page: pageData }));
        if (this.products.seo) {
          this.seo.getSeoField(this.products.seo, this.metaTagService);
        }
      },
      (err) => {
        console.log(err, 'err');
      }
    );
  }

  ngOnInit(): void {
    this.getEntry();
  }

  ngAfterContentInit(): void {
    this.cs.onEntryChange(() => {
      this.getEntry();
    });
  }

  filterProductTypes(entries) {
    this.archivedContent = [];
    entries.map((entry) => {
      if (entry.is_archived) {
        this.archivedContent.push(entry);
      }
    });
  }
}
