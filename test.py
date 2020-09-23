import unittest

from main import parse_most_significant_data


class TestMain(unittest.TestCase):
    def test_parse_most_signification_positive(self):
        bytes_to_parse = b"\x00\x00\x00\x00\x00\x02\x83\xB4"
        result = parse_most_significant_data(bytes_to_parse)
        self.assertEqual(result, 164788)

    def test_example(self):
        bytes_to_parse = b"\xff\xff\xff\xff\xff\xff\xff\x30"
        result = parse_most_significant_data(bytes_to_parse)
        self.assertEqual(result, -208)
