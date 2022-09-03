
const main = () => {
  let bundles = [];
  bundles[0] = [22.5, 22.5, 22.5, 22.5, 3.3, 3.3, 3.3, 0.05, 0.05];
  bundles[1] = [22.5, 22.5, 22.5, 22.5, 3.3, 3.3, 3.3, 0.05, 0.05];
  bundles[2] = [15, 15, 15, 15, 13, 13, 13, 0.5, 0.5];
  bundles[3] = [15, 15, 15, 15, 13, 13, 13, 0.5, 0.5];
  bundles[4] = [8, 8, 8, 8, 21, 21, 21, 2.5, 2.5];
  bundles[5] = [8, 8, 8, 8, 21, 21, 21, 2.5, 2.5];

  let gen_bundles = bundles.map((arr) => {
    let subArr = [];
    let sum = 0;
    arr.forEach(element => {
      sum += element * 10;
      subArr.push(sum);
    });
    return subArr;
  })
  console.log("gen_bundles =", gen_bundles);
}

main();

