<script setup lang="ts">
import { computed } from 'vue';

import {
  parseCookie,
  parseSetCookie,
  SetCookieItem,
} from '../../../lib/header-parser';
import { getHeaders } from '../../../lib/util';
import { CommonRequest, UpgradeRequest } from '../../../store/request';
import DetailItem from '../common/DetailItem.vue';
import DetailSection from '../common/DetailSection.vue';

const props = defineProps<{
  request: CommonRequest | UpgradeRequest;
}>();

const requestCookies = computed(() => {
  const cookies = getHeaders(props.request.request.rawHeaders, 'cookie');
  return cookies.flatMap((cookie) => parseCookie(cookie) || []);
});

interface ResponseCookieColumn {
  name: string;
  width?: string;
  getValue: (item: SetCookieItem) => any;
}

const responseCookieColumns: ResponseCookieColumn[] = [
  {
    name: 'Name',
    getValue: (item) => item.name,
    width: '100px',
  },
  {
    name: 'Value',
    getValue: (item) => item.value,
    width: '210px',
  },
  {
    name: 'Size',
    getValue: (item) => item.value.length,
  },
  {
    name: 'Expires',
    getValue: (item) => item.params.Expires,
  },
  {
    name: 'Max-Age',
    getValue: (item) => item.params['Max-Age'],
  },
  {
    name: 'Domain',
    getValue: (item) => item.params.Domain,
  },
  {
    name: 'Path',
    getValue: (item) => item.params.Path,
  },
  {
    name: 'Secure',
    getValue: (item) => item.params.Secure,
  },
  {
    name: 'HttpOnly',
    getValue: (item) => item.params.HttpOnly,
  },
  {
    name: 'SameSite',
    getValue: (item) => item.params.SameSite,
  },
];

const responseCookies = computed(() => {
  if (props.request.type !== 'request') {
    return [];
  }
  const setCookies = getHeaders(
    props.request.response?.rawHeaders,
    'set-cookie',
  );
  return setCookies.map((cookie) => parseSetCookie(cookie)!);
});
</script>

<template>
  <div class="cookieDetail-wrap">
    <DetailSection
      v-if="responseCookies.length"
      label="Response Cookies"
    >
      <div class="cookie-response">
        <table
          class="cookie-responseTable"
          cellspacing="0"
          cellpadding="0"
        >
          <thead>
            <tr>
              <th
                v-for="(column, index) in responseCookieColumns"
                :key="index"
                :style="{ width: column.width }"
                :title="column.name"
              >
                {{ column.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in responseCookies"
              :key="index"
            >
              <td
                v-for="(column, colIndex) in responseCookieColumns"
                :key="colIndex"
                :title="String(column.getValue(item) ?? '')"
              >
                {{ String(column.getValue(item) ?? '') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DetailSection>

    <DetailSection
      v-if="requestCookies.length"
      label="Request Cookies"
    >
      <DetailItem
        v-for="(item, index) in requestCookies"
        :key="index"
        :label="item.name"
      >
        {{ item.value }}
      </DetailItem>
    </DetailSection>
  </div>
</template>

<style scoped lang="scss">
.cookieDetail-wrap {
  height: 100%;
  overflow: auto;
}

.cookie-response {
  padding: 0 5px 0 25px;
  font-size: 12px;
}

.cookie-responseTable {
  width: 100%;
  border-spacing: 0;
  line-height: 17px;
  table-layout: fixed;
  white-space: nowrap;
  border: 1px solid var(--color-details-hairline);

  th,
  td {
    position: relative;
    overflow: hidden;
    text-overflow: ellipsis;
    border-right: 1px solid var(--color-details-hairline);
  }

  th {
    position: relative;
    padding: 4px 5px;
    text-align: left;
    background: var(--color-background-elevation-1);
    border-width: 0 1px 1px 0;
  }

  tr {
    &:nth-child(2n) td {
      background: var(--network-grid-stripe-color);
    }

    &:hover td {
      background: var(--item-hover-color);
    }
  }

  td {
    padding: 3px 5px;
  }
}
</style>
