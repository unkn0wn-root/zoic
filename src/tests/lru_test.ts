import { assertEquals, assert } from "https://deno.land/std@0.145.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.145.0/testing/bdd.ts";
import PerfMetrics from '../performanceMetrics.ts';
import LRU from '../lru.ts'

describe("LRU tests", () => {
  const lru = new LRU(50, new PerfMetrics, 6);

  it("Adds new items to the cache", () => {
    lru.put('item1', {headers:{}, body: 'testing1', status:200}, 10);
    lru.put('item2', {headers:{}, body: 'testing2', status:200}, 10);
    lru.put('item3', {headers:{}, body: 'testing3', status:200}, 10);
    lru.put('item4', {headers:{}, body: 'testing4', status:200}, 10);
    lru.put('item5', {headers:{}, body: 'testing5', status:200}, 10);
    assertEquals(lru.cache.item1.value.body, 'testing1');
    assertEquals(lru.cache.item2.value.body, 'testing2');
    assertEquals(lru.cache.item3.value.body, 'testing3');
    assertEquals(lru.cache.item4.value.body, 'testing4');
    assertEquals(lru.cache.item5.value.body, 'testing5');
    assertEquals(lru.list.head?.key, 'item5');
    assertEquals(lru.list.tail?.key, 'item1');
    assertEquals(lru.length, 5);
  });

  it("Gets items from the cache, and moves them to the head", () => {
    const item = lru.get('item3');
    assertEquals(lru.list.head?.value, item);
    assertEquals(lru.list.head?.next?.key, 'item5');
    assertEquals(lru.list.head?.next?.next?.key, 'item4');
    assertEquals(lru.list.head?.next?.next?.next?.key, 'item2');
    assertEquals(lru.list.head?.next?.next?.next?.next?.key, 'item1');
    assertEquals(lru.list.head?.next?.next?.next?.next, lru.list.tail);
    assertEquals(lru.list.head?.next?.next?.next?.next?.next, null);
    assertEquals(lru.cache.item1.value.body, 'testing1');
    assertEquals(lru.cache.item2.value.body, 'testing2');
    assertEquals(lru.cache.item3.value.body, 'testing3');
    assertEquals(lru.cache.item4.value.body, 'testing4');
    assertEquals(lru.cache.item5.value.body, 'testing5');
  });

  it("Deletes items from the front of the cache", () => {
    lru.delete('item3');
    assertEquals(lru.cache.item3, undefined);
    assertEquals(lru.list.head?.key, 'item5');
    assertEquals(lru.list.head?.next?.key, 'item4');
    assertEquals(lru.list.head?.next?.next?.key, 'item2');
    assertEquals(lru.list.head?.next?.next?.next?.key, 'item1');
    assertEquals(lru.list.head?.next?.next?.next, lru.list.tail)
    assertEquals(lru.cache.item1.value.body, 'testing1');
    assertEquals(lru.cache.item2.value.body, 'testing2');
    assertEquals(lru.cache.item4.value.body, 'testing4');
    assertEquals(lru.cache.item5.value.body, 'testing5');
  });

  it("Deletes items from the end of the cache", () => {
    lru.delete('item1');
    assertEquals(lru.cache.item1, undefined);
    assertEquals(lru.list.head?.key, 'item5');
    assertEquals(lru.list.head?.next?.key, 'item4');
    assertEquals(lru.list.head?.next?.next?.key, 'item2');
    assertEquals(lru.list.head?.next?.next, lru.list.tail);
    assertEquals(lru.cache.item2.value.body, 'testing2');
    assertEquals(lru.cache.item4.value.body, 'testing4');
    assertEquals(lru.cache.item5.value.body, 'testing5');
  });

  it("Deletes items from the middle of the cache", () => {
    lru.delete('item4');
    assertEquals(lru.cache.item4, undefined);
    assertEquals(lru.list.head?.key, 'item5');
    assertEquals(lru.list.head?.next?.key, 'item2');
    assertEquals(lru.list.head?.next, lru.list.tail);
    assertEquals(lru.cache.item2.value.body, 'testing2');
    assertEquals(lru.cache.item5.value.body, 'testing5');
  });

  it("Adds an item to the head after deleting items", () => {
    lru.put('item666', {headers:{}, body: 'testing1', status:200}, 10);
    assertEquals(lru.list.head?.key, 'item666');
    assertEquals(lru.list.head?.next?.key, 'item5');
    assertEquals(lru.list.head?.next?.next?.key, 'item2');
    assertEquals(lru.list.head?.next?.next?.next, null);
  })

  it("Deletes the last item when over capacity", () => {
    lru.put('item30', {headers:{}, body: 'testing3', status:200}, 10);
    lru.put('item40', {headers:{}, body: 'testing4', status:200}, 10);
    lru.put('item50', {headers:{}, body: 'testing5', status:200}, 10);
    lru.put('item60', {headers:{}, body: 'testing6', status:200}, 10);
    lru.put('item70', {headers:{}, body: 'testing7', status:200}, 10);
    lru.put('item80', {headers:{}, body: 'testing8', status:200}, 10);
    lru.put('item90', {headers:{}, body: 'testing9', status:200}, 10);
    lru.put('item99', {headers:{}, body: 'testing1', status:200}, 10);
    assertEquals(lru.cache.item30, undefined);
    assertEquals(lru.cache.item50.value.body, 'testing5');
    assertEquals(lru.cache.item60.value.body, 'testing6');
    assertEquals(lru.cache.item80.value.body, 'testing8');
    assertEquals(lru.list.head?.key, 'item99');
    assertEquals(lru.list.head?.next?.key, 'item90');
    assertEquals(lru.list.head?.next?.next?.key, 'item80');
    assertEquals(lru.list.head?.next?.next?.next?.key, 'item70');
    assertEquals(lru.list.head?.next?.next?.next?.next?.key, 'item60');
    assertEquals(lru.list.head?.next?.next?.next?.next?.next?.key, 'item50');
    assertEquals(lru.list.head?.next?.next?.next?.next?.next?.next, null);
    assertEquals(lru.list.tail?.prev?.prev?.prev?.prev?.prev?.key, 'item99');
    assertEquals(lru.list.tail?.prev?.prev?.prev?.prev?.key, 'item90');
    assertEquals(lru.list.tail?.prev?.prev?.prev?.key, 'item80');
    assertEquals(lru.list.tail?.prev?.prev?.key, 'item70');
    assertEquals(lru.list.tail?.prev?.key, 'item60');
    assertEquals(lru.list.tail?.key, 'item50');
    assertEquals(lru.cache.item80.value.body, 'testing8');
    assertEquals(lru.cache.item90.value.body, 'testing9');
    assertEquals(lru.cache.item99.value.body, 'testing1');
    assertEquals(lru.cache.item40, undefined);
  });

  it("Expires entry after set time", async () => {
    const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const shortLru = new LRU(1, new PerfMetrics, 8);
    shortLru.put('item1', {headers:{}, body: 'testing1', status:200}, 10);
    await timeout(1001);
    assert(!shortLru.get('item1'));
    assert(!shortLru.list.head);
    shortLru.put('item2', {headers:{}, body: 'testing2', status:200}, 10);
    await timeout(99);
    assert(shortLru.get('item2'));
    assert(shortLru.list.head);
  })
})