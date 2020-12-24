using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Google.Cloud.Vision.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace BonnenScannerWebApp.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
            Output = "[]";
        }

        public void OnGet()
        {
        }

        [BindProperty] public IFormFile Upload { get; set; }

        public string Output { get; set; }

        public async Task OnPostAsync()
        {
            if (Upload == null)
            {
                return;
            }
            var image = await Image.FromStreamAsync(Upload.OpenReadStream());
            var client = await ImageAnnotatorClient.CreateAsync();

            var response = await client.DetectTextAsync(image);
            var responseList = response.Skip(1).OrderBy(x => x.BoundingPoly.Vertices.First().Y).ToList();
            var height = 0;
            var oldY = 0;
            var result = new List<List<EntityAnnotation>>();
            List<EntityAnnotation> currentList = null;
            foreach (var item in responseList)
            {
                if (oldY == 0 || item.BoundingPoly.Vertices[0].Y > oldY + height * 0.5)
                {
                    oldY = item.BoundingPoly.Vertices[0].Y;
                    height = item.BoundingPoly.Vertices[0].Y - item.BoundingPoly.Vertices[3].Y;
                    if (height < 0)
                    {
                        height *= -1;
                    }

                    currentList = new List<EntityAnnotation>();
                    result.Add(currentList);
                }

                currentList.Add(item);
            }

            var rows = new List<string>();

            foreach (var cells in result.Select(row => row.OrderBy(x => x.BoundingPoly.Vertices.First().X).ToArray()))
            {
                var stringBuilder = new StringBuilder();
                foreach (var cell in cells)
                {
                    stringBuilder.Append(cell.Description);
                    stringBuilder.Append(" ");
                }

                rows.Add(stringBuilder.ToString().Trim());
            }

            var output = new List<List<string>>();
            foreach (var row in rows)
            {
                var regex = Regex.Match(row, @"(?<price>-?\d{1,3},\d{2})?\s?(?<bonus>P?B)?$");
                var length = regex.Groups["price"].Index;
                length = length == 0 ? row.Length : length;

                var currentRow = new List<string>
                {
                    row.Substring(0, length),
                    regex.Groups["price"].Value,
                    regex.Groups["bonus"].Value
                };
                output.Add(currentRow);
            }

            Output = JsonConvert.SerializeObject(output);
        }
    }
}
