import {GroupByModel} from './groupByModel';

export class GroupByUtil {
  static groupBy(xs: any[], f: (n: any) => any): GroupByModel[] {
    const groupByObjects = xs.reduce(
      (
        previous: any,
        current: any,
        i: number,
        dataRef: any,
        k = f(current)) => ((previous[k] || (previous[k] = [])).push(current), previous), {}
    );
    const groupByModels: GroupByModel[] = [];
    for (const obj in groupByObjects) {
      if (!groupByObjects.hasOwnProperty(obj)) {
        continue;
      }
      groupByModels.push({
        key: obj,
        values: groupByObjects[obj]
      });
    }
    return groupByModels;
  }
}
